import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExcelService } from '../common/services/excel.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Member } from './schemas/member.schema';

@Controller('members')
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly excelService: ExcelService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() payload: CreateMemberDto): Promise<Member> {
    return await this.membersService.create(payload);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  async getMembers(@Query() paginationDto: PaginationDto) {
    return this.membersService.getPaginated(paginationDto);
  }

  @Get(':dni')
  async searchByDni(@Param('dni') dni: string): Promise<Member> {
    try {
      const member = await this.membersService.searchByDni(dni);
      if (!member) {
        throw new NotFoundException(`Socio no encontrado con el DNI: ${dni}`);
      }
      return member;
    } catch (err: unknown) {
      const ex = err as Error & { status?: number };
      if (ex.status === 404) {
        throw ex;
      } else {
        Logger.error('Error while registering member access', ex);
        throw new HttpException(ex.message || String(ex), HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: (req, file: any, cb) => {
      const allowed = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      const filename = file.originalname?.toLowerCase() || '';
      const extAllowed = ['.csv', '.xls', '.xlsx'];
      const hasAllowedExt = extAllowed.some((ext) => filename.endsWith(ext));

      if (allowed.includes(file.mimetype) || hasAllowedExt) {
        cb(null, true);
      } else {
        cb(new HttpException('Tipo de archivo no permitido. Use .csv, .xls o .xlsx', HttpStatus.BAD_REQUEST), false);
      }
    },
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  }))
  async uploadFile(
    @UploadedFile() file: any,
  ): Promise<any> {
    if (!file || !file.buffer) {
      throw new HttpException('Archivo no recibido', HttpStatus.BAD_REQUEST);
    }

    try {
      const jsonData = this.excelService.readExcelBuffer(file.buffer);
      // helper to find a value in parsed object case-insensitively using common header names
      const findField = (obj: Record<string, unknown>, candidates: string[]) => {
        const keys = Object.keys(obj);
        const lowerMap: Record<string, string> = {};
        for (const k of keys) lowerMap[k.toLowerCase().trim()] = k;
        for (const c of candidates) {
          const lc = c.toLowerCase().trim();
          if (lc in lowerMap) return obj[lowerMap[lc]] as string | undefined;
        }
        // try a looser match: header contains candidate substring
        for (const k of keys) {
          const lk = k.toLowerCase();
          for (const c of candidates) {
            if (lk.includes(c.toLowerCase().trim())) return obj[k] as string | undefined;
          }
        }
        return undefined;
      };
      const parsedMembers = jsonData.map((parsed) => {
        const p = parsed as Record<string, unknown>;
        const name = findField(p, ['nombre', 'name', 'fullname', 'full_name', 'nombre completo', 'nombre_completo']);
        const dni = findField(p, ['dni', 'documento', 'document', 'cedula', 'rut']);
        return {
          fullName: (typeof name === 'string' ? name : '') ?? '',
          dni: (typeof dni === 'string' ? dni : '') ?? '',
        } as Partial<Member>;
      });
      // Use bulk safe insert that continues on errors
      const result = await this.membersService.createMembersBulk(parsedMembers);
      return {
        inserted: result.inserted.length,
        failures: result.failures,
      };
    } catch (err: unknown) {
      const ex = err as Error;
      Logger.error('Error while inserting members', ex);
      throw new HttpException(ex.message || String(ex), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('upload-rows')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async uploadRows(@Body() members: any[]): Promise<{ inserted: number; failures: { index?: number; dni?: string; fullName?: string; message: string }[] } > {
    if (!Array.isArray(members) || members.length === 0) {
      throw new HttpException('No se recibieron filas para subir', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.membersService.createMembersBulk(members as Partial<Member>[]);
      return {
        inserted: result.inserted.length,
        failures: result.failures,
      };
    } catch (err: unknown) {
      const ex = err as Error;
      Logger.error('Error while inserting member rows', ex);
      throw new HttpException(ex.message || String(ex), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateMember: UpdateMemberDto,
  ): Promise<Member> {
    return this.membersService.update(id, updateMember);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string): Promise<Member> {
    return this.membersService.delete(id);
  }
}

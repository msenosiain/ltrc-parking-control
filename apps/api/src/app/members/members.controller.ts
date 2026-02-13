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
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: { buffer: Buffer },
  ): Promise<Member[]> {
    try {
      const jsonData = this.excelService.readExcelBuffer(file.buffer);
      const parsedMembers = jsonData.map((parsed) => {
        const p = parsed as Record<string, unknown>;
        return {
          fullName: (p['nombre'] as string) ?? '',
          dni: (p['dni'] as string) ?? '',
        } as Member;
      });
      return await this.membersService.createMembers(parsedMembers);
    } catch (err: unknown) {
      const ex = err as Error;
      Logger.error('Error while inserting members', ex);
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

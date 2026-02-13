import { Injectable } from '@nestjs/common';
import { addMinutes, isBefore } from 'date-fns';
import { AccessLogEntry } from './schemas/access-log-entry.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { MembersService } from '../members/members.service';
import { Member } from '../members/schemas/member.schema';

export interface RegisterAccessResponse {
  accessGranted: boolean;
  member: Member | null;
  title: string;
  subtitle: string;
}

@Injectable()
export class AccessLogService {
  constructor(
    @InjectModel(AccessLogEntry.name)
    private readonly accessLogEntryModel: Model<AccessLogEntry>,
    private readonly membersService: MembersService,
    private readonly configService: ConfigService,
  ) {}

  async registerAccess(dni: string): Promise<RegisterAccessResponse> {
    const member = await this.membersService.searchByDni(dni);

    if (!member) {
      return {
        accessGranted: false,
        member: null,
        title: 'Acceso Denegado',
        subtitle: `No se encontró socio con DNI ${dni}`,
      };
    }

    const lastAccess = await this.accessLogEntryModel
      .findOne({ dni })
      .sort({ createdAt: -1 });

    if (lastAccess) {
      const now = new Date();
      const threshold = this.configService.get<number>(
        'ACCESS_LOG_THRESHOLD',
        30,
      );
      const accessThreshold = addMinutes(lastAccess.createdAt, threshold);
      if (isBefore(now, accessThreshold)) {
        return {
          accessGranted: false,
          member,
          title: `Acceso Denegado para ${member.dni}`,
          subtitle: `${member.fullName}, debes esperar ${threshold} minutos antes de volver a ingresar`,
        };
      }
    }

    // Registrar un nuevo acceso
    const newAccess = new this.accessLogEntryModel({ dni });
    await newAccess.save();

    return {
      accessGranted: true,
      member,
      title: `Hola ${member.fullName}!`,
      subtitle: 'Acceso registrado con éxito',
    };
  }
}

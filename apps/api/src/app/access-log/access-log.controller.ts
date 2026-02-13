import { Body, Controller, Post } from '@nestjs/common';
import { AccessLogService, RegisterAccessResponse } from './access-log.service';
import { DniDto } from '../common/dto/dni.dto';

@Controller('access')
export class AccessLogController {
  constructor(private readonly accessLogService: AccessLogService) {}

  @Post()
  async registerAccess(
    @Body() dniDto: DniDto,
  ): Promise<RegisterAccessResponse> {
    return this.accessLogService.registerAccess(dniDto.dni);
  }
}

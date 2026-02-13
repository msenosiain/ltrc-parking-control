import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '../common/common.module';
import {
  AccessLogEntry,
  AccessLogSchema,
} from './schemas/access-log-entry.schema';
import { AccessLogService } from './access-log.service';
import { AccessLogController } from './access-log.controller';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AccessLogEntry.name,
        schema: AccessLogSchema,
        collection: 'access-log',
      },
    ]),
    CommonModule,
    MembersModule,
  ],
  exports: [AccessLogService],
  providers: [AccessLogService],
  controllers: [AccessLogController],
})
export class AccessLogModule {}

import { Module } from '@nestjs/common';
import { ParkingController } from './parking.controller';
import { ParkingService } from './parking.service';
import { CommonModule } from '../common/common.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Parking, ParkingSchema } from './schemas/parking.schema';

@Module({
  imports: [
    CommonModule,
    MongooseModule.forFeature([{ name: Parking.name, schema: ParkingSchema }]),
  ],
  exports: [ParkingService],
  providers: [ParkingService],
  controllers: [ParkingController],
})
export class ParkingModule {}

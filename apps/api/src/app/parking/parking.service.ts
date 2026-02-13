import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Parking } from './schemas/parking.schema';

@Injectable()
export class ParkingService implements OnModuleInit {
  constructor(
    @InjectModel(Parking.name) private parkingModel: Model<Parking>,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    const count = await this.parkingModel.countDocuments();
    if (count === 0) {
      const total = this.config.get<number>('PARKING_SPACES', 0);
      await this.parkingModel.create({ total, occupied: 0 });
    }
  }

  private async getParkingDoc() {
    return this.parkingModel.findOne().exec();
  }

  async getStatus() {
    const parking = await this.getParkingDoc();
    if (!parking) {
      return { total: 0, occupied: 0, available: 0 };
    }
    return {
      total: parking.total,
      occupied: parking.occupied,
      available: parking.total - parking.occupied,
    };
  }

  async carEnters() {
    const parking = await this.getParkingDoc();
    if (parking && parking.occupied < parking.total) {
      parking.occupied++;
      await parking.save();
    }
    return this.getStatus();
  }

  async carLeaves() {
    const parking = await this.getParkingDoc();
    if (parking && parking.occupied > 0) {
      parking.occupied--;
      await parking.save();
    }
    return this.getStatus();
  }
}

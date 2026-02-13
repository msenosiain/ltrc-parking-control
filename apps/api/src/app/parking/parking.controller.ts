// parking.controller.ts
import { Controller, Get, Post } from '@nestjs/common';
import { ParkingService } from './parking.service';

@Controller('parking')
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  @Get('status')
  getStatus() {
    return this.parkingService.getStatus();
  }

  @Post('enter')
  carEnters() {
    return this.parkingService.carEnters();
  }

  @Post('leave')
  carLeaves() {
    return this.parkingService.carLeaves();
  }
}

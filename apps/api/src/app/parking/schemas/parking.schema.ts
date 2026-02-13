import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Parking extends Document {
  @Prop({ required: true })
  total!: number;

  @Prop({ default: 0 })
  occupied!: number;
}

export const ParkingSchema = SchemaFactory.createForClass(Parking);

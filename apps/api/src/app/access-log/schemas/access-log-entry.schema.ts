import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AccessLogEntry extends Document {
  @Prop({ required: true })
  dni!: string;

  @Prop({ default: Date.now })
  createdAt!: Date;
}

export const AccessLogSchema = SchemaFactory.createForClass(AccessLogEntry);

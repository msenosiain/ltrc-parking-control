import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Member extends Document {
  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true, unique: true })
  dni!: string;
}

export const MemberSchema = SchemaFactory.createForClass(Member);

// Ensure an explicit unique index exists on dni (helps when index isn't created automatically)
MemberSchema.index({ dni: 1 }, { unique: true });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../auth/roles.enum';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  googleId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ type: [String], enum: Role, default: [Role.USER] })
  roles!: Role[];
}

export const UserSchema = SchemaFactory.createForClass(User);

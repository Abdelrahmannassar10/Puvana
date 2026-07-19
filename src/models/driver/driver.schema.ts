import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DriverDocument = HydratedDocument<Driver>;

@Schema({ timestamps: true })
export class Driver {
  @Prop({ required: true, unique: true, trim: true })
  workerCode: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isOnline: boolean;
}

export const DriverSchema = SchemaFactory.createForClass(Driver);

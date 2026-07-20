import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DriverLocationDocument = HydratedDocument<DriverLocation>;

@Schema({ timestamps: true })
export class DriverLocation {
  @Prop({ type: Types.ObjectId, ref: 'Driver', required: true, index: true })
  driverId: Types.ObjectId;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const DriverLocationSchema = SchemaFactory.createForClass(DriverLocation);

DriverLocationSchema.index({ driverId: 1, timestamp: -1 });
DriverLocationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SavedLocationDocument = HydratedDocument<SavedLocation>;

@Schema({ timestamps: true })
export class SavedLocation {
  @Prop({ type: Types.ObjectId, ref: 'Driver', required: true, index: true })
  driverId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;
}

export const SavedLocationSchema = SchemaFactory.createForClass(SavedLocation);

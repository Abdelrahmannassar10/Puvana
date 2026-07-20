import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DailyRouteDocument = HydratedDocument<DailyRoute>;

export type StopStatus = 'pending' | 'in_progress' | 'delivered' | 'not_delivered';
export type RouteStatus = 'planned' | 'in_progress' | 'completed';

@Schema({ _id: true })
export class RouteStop {
  @Prop({ type: Types.ObjectId, ref: 'SavedLocation' })
  savedLocationId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop({ required: true })
  order: number;

  @Prop({ enum: ['pending', 'in_progress', 'delivered', 'not_delivered'], default: 'pending' })
  status: StopStatus;

  @Prop()
  etaMinutes?: number;

  @Prop()
  distanceMeters?: number;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;
}
export const RouteStopSchema = SchemaFactory.createForClass(RouteStop);

@Schema({ timestamps: true })
export class DailyRoute {
  @Prop({ type: Types.ObjectId, ref: 'Driver', required: true, index: true })
  driverId: Types.ObjectId;

  @Prop({ required: true })
  date: string;

  @Prop({ enum: ['planned', 'in_progress', 'completed'], default: 'planned' })
  status: RouteStatus;

  @Prop({ type: [RouteStopSchema], default: [] })
  stops: RouteStop[];

  @Prop({ default: -1 })
  currentStopIndex: number;
}

export const DailyRouteSchema = SchemaFactory.createForClass(DailyRoute);

DailyRouteSchema.index({ driverId: 1, date: 1 });

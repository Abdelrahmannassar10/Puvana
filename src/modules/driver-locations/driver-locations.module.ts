import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DriverLocation, DriverLocationSchema } from '../../models/driver-location/driver-location.schema';
import { DriverLocationsService } from './driver-locations.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: DriverLocation.name, schema: DriverLocationSchema }]),
  ],
  providers: [DriverLocationsService],
  exports: [DriverLocationsService],
})
export class DriverLocationsModule {}
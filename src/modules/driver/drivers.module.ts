import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Driver, DriverSchema } from '../../models/driver/driver.schema';
import { SavedLocationsModule } from '../saved-locations/saved-locations.module';
import { DailyRoutesModule } from '../daily-routes/daily-routes.module';
import { DriverController } from './driver.controller';
import { DriversService } from './drivers.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Driver.name, schema: DriverSchema }]),
    SavedLocationsModule,
    DailyRoutesModule,
  ],
  controllers: [DriverController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyRoute, DailyRouteSchema } from '../../models/daily-routes/daily-route.schema';
import { SavedLocationsModule } from '../saved-locations/saved-locations.module';
import { DailyRoutesService } from './daily-routes.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: DailyRoute.name, schema: DailyRouteSchema }]),
    SavedLocationsModule,
  ],
  providers: [DailyRoutesService],
  exports: [DailyRoutesService],
})
export class DailyRoutesModule {}

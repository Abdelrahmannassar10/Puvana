import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SavedLocation, SavedLocationSchema } from '../../models/saved-locations/saved-location.schema';
import { SavedLocationsService } from './saved-locations.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: SavedLocation.name, schema: SavedLocationSchema }])],
  providers: [SavedLocationsService],
  exports: [SavedLocationsService],
})
export class SavedLocationsModule {}

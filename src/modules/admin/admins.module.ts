import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from '../../models/admin/admin.schema';
import { Driver, DriverSchema } from '../../models/driver/driver.schema';
import { DailyRoute, DailyRouteSchema } from '../../models/daily-routes/daily-route.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: Driver.name, schema: DriverSchema },
      { name: DailyRoute.name, schema: DailyRouteSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminsModule {}

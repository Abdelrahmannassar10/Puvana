import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/strategies/jwt.strategy';
import { DriversService } from './drivers.service';
import { SavedLocationsService } from '../saved-locations/saved-locations.service';
import { DailyRoutesService } from '../daily-routes/daily-routes.service';
import { CreateSavedLocationDto } from '../saved-locations/dto/create-saved-location.dto';
import { PlanDailyRouteDto } from '../daily-routes/dto/plan-daily-route.dto';
import { UpdateStopStatusDto } from '../daily-routes/dto/update-stop-status.dto';
import { ModifyRouteDto } from '../daily-routes/dto/modify-route.dto';

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriverController {
  constructor(
    private readonly driversService: DriversService,
    private readonly savedLocationsService: SavedLocationsService,
    private readonly dailyRoutesService: DailyRoutesService,
  ) {}

  @Get('me')
  @Roles('driver')
  getProfile(@CurrentUser() user: AuthUser) {
    return this.driversService.findById(user.userId);
  }

  @Get('me/saved-locations')
  @Roles('driver')
  getSavedLocations(@CurrentUser() user: AuthUser) {
    return this.savedLocationsService.findByDriver(user.userId);
  }

  @Post('me/saved-locations')
  @Roles('driver')
  createSavedLocation(@CurrentUser() user: AuthUser, @Body() dto: CreateSavedLocationDto) {
    return this.savedLocationsService.create(user.userId, dto);
  }

  @Post('me/daily-route/plan')
  @Roles('driver')
  planDailyRoute(@CurrentUser() user: AuthUser, @Body() dto: PlanDailyRouteDto) {
    return this.dailyRoutesService.planRoute(user.userId, dto);
  }

  @Get('me/daily-route')
  @Roles('driver')
  getTodayRoute(@CurrentUser() user: AuthUser) {
    return this.dailyRoutesService.getTodayRoute(user.userId);
  }

  @Post('me/daily-route/start')
  @Roles('driver')
  startRoute(@CurrentUser() user: AuthUser) {
    return this.dailyRoutesService.startRoute(user.userId);
  }

  @Patch('me/daily-route/stops/:stopId')
  @Roles('driver')
  updateStopStatus(@CurrentUser() user: AuthUser, @Body() dto: UpdateStopStatusDto, @Param('stopId') stopId: string) {
    return this.dailyRoutesService.updateStopStatus(user.userId, stopId, dto);
  }

  @Patch('me/daily-route/modify')
  @Roles('driver')
  modifyActiveRoute(@CurrentUser() user: AuthUser, @Body() dto: ModifyRouteDto) {
    return this.dailyRoutesService.modifyActiveRoute(user.userId, dto);
  }
}

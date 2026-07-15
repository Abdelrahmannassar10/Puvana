import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateDriverAdminDto } from './dto/create-driver-admin.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('seed')
  @Roles('admin')
  seedAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.ensureSeedAdmin(dto);
  }

  @Post('drivers')
  @Roles('admin')
  createDriver(@Body() dto: CreateDriverAdminDto) {
    return this.adminService.createDriverAccount(dto);
  }

  @Get('drivers')
  @Roles('admin')
  listDrivers() {
    return this.adminService.listDrivers();
  }

  @Get('routes')
  @Roles('admin')
  listRoutes() {
    return this.adminService.listRoutes();
  }

  @Get('routes/:routeId')
  @Roles('admin')
  getRoute(@Param('routeId') routeId: string) {
    return this.adminService.getRouteById(routeId);
  }

  @Patch('drivers/:driverId/status')
  @Roles('admin')
  updateDriverStatus(@Param('driverId') driverId: string, @Body('isActive') isActive: boolean) {
    return this.adminService.suspendDriver(driverId, isActive);
  }

  @Delete('drivers/:driverId')
  @Roles('admin')
  deleteDriver(@Param('driverId') driverId: string) {
    return this.adminService.deleteDriver(driverId);
  }
}

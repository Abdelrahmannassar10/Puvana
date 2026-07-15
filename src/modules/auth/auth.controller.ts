import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DriverLoginDto } from './dto/driver-login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('driver/login')
  @HttpCode(HttpStatus.OK)
  driverLogin(@Body() dto: DriverLoginDto) {
    return this.authService.driverLogin(dto.workerCode, dto.password);
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto.email, dto.password);
  }
}

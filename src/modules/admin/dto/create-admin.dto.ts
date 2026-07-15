import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}

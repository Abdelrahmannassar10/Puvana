import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  workerCode: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

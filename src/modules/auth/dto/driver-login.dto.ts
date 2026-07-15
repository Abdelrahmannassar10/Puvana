import { IsNotEmpty, IsString } from 'class-validator';

export class DriverLoginDto {
  @IsString()
  @IsNotEmpty()
  workerCode: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

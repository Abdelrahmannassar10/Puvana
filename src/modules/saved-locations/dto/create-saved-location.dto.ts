import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateSavedLocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class ModifyRouteDto {
  @IsNumber()
  currentLat: number;

  @IsNumber()
  currentLng: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  addLocationIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeStopIds?: string[];
}

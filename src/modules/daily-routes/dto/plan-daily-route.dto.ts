import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class PlanDailyRouteDto {
  @IsNumber()
  currentLat: number;

  @IsNumber()
  currentLng: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locationIds?: string[];
}

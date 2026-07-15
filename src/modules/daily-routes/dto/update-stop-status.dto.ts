import { IsIn } from 'class-validator';

export class UpdateStopStatusDto {
  @IsIn(['delivered', 'not_delivered'])
  status: 'delivered' | 'not_delivered';
}

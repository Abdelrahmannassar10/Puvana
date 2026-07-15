import { Global, Module } from '@nestjs/common';
import { OrsService } from './utils/ors.service';

@Global()
@Module({
  providers: [OrsService],
  exports: [OrsService],
})
export class CommonModule {}

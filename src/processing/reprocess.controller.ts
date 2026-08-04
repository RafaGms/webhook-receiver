import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ReprocessService } from './reprocess.service';

@Controller('events')
export class ReprocessController {
  constructor(private readonly reprocessService: ReprocessService) {}

  @Post(':id/reprocess')
  @HttpCode(HttpStatus.OK)
  reprocess(@Param('id', ParseUUIDPipe) id: string) {
    return this.reprocessService.reprocess(id);
  }
}

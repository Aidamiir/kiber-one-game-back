import { Module } from '@nestjs/common';
import { WebsocketsService } from '@/services/websockets.service';

@Module({
	providers: [WebsocketsService],
	exports: [WebsocketsService],
})
export class WebsocketsModule {
}

import { Module } from '@nestjs/common';

import { UsersModule } from '@/modules/users/users.module';
import { WebsocketGateway } from '@/modules/users/websocket/websocket.gateway';

@Module({
	imports: [UsersModule],
	providers: [WebsocketGateway],
})
export class WebsocketModule {}

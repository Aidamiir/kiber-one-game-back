import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UsersModule } from '@/modules/users.module';
import { AuthModule } from '@/modules/auth.module';
import { WebsocketsModule } from '@/modules/websockets.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		AuthModule,
		UsersModule,
		WebsocketsModule
	],
})
export class AppModule {
}

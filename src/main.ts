import { NestFactory } from '@nestjs/core'
import * as dotenv from 'dotenv'
import 'module-alias/register'

import { AppModule } from './app.module'

dotenv.config();

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.setGlobalPrefix('api');
	app.enableCors({
		origin: ['http://localhost:3000', 'http://localhost:4173', 'https://kiber-one-game.ru'],
	});

	await app.listen(8080);
}

bootstrap();

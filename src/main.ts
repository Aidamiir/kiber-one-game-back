import { NestFactory } from '@nestjs/core'
import * as dotenv from 'dotenv'
import 'module-alias/register'

import { AppModule } from './app.module'

dotenv.config();

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.setGlobalPrefix('api');
	app.enableCors({
		origin: ['http://localhost:3000', 'http://localhost:4173', 'http://87.228.17.48:3000'],
	});

	await app.listen(8080);
}

bootstrap();

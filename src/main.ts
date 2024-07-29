import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '@/app.module';
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService);
	const port = configService.get<number>('PORT', 8080);
	const corsOrigins = configService.get<string>('CORS_ORIGINS');

	if (!corsOrigins) {
		throw new Error('CORS_ORIGINS configuration is missing');
	}

	app.setGlobalPrefix('api');

	const config = new DocumentBuilder()
		.setTitle('API Documentation')
		.setDescription('The API description')
		.setVersion('1.0')
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api-docs', app, document);

	app.enableCors({ origin: corsOrigins.split(',').map(origin => origin.trim()) });
	app.useGlobalFilters(new AllExceptionsFilter());
	app.useGlobalPipes(new ValidationPipe({
		transform: true,
		whitelist: true,
		forbidNonWhitelisted: true,
		stopAtFirstError: true,
	}));

	await app.listen(port);
	console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();

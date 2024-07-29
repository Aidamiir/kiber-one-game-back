import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from '@/modules/users/users.module';
import { JwtTokensService } from '@/modules/auth/jwt-tokens/jwt-tokens.service';
import { JwtTokensStrategy } from '@/modules/auth/jwt-tokens/jwt-tokens.strategy';

@Module({
	imports: [
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				secret: configService.get('JWT_SECRET'),
			}),
		}),
		UsersModule,
	],
	providers: [JwtTokensService, JwtTokensStrategy],
	exports: [JwtTokensService],
})

export class JwtTokensModule {}

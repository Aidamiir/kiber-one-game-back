import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from '@/controllers/auth.controller';
import { UsersModule } from '@/modules/users.module';
import { AuthService } from '@/services/auth.service';
import { getJwtConfig } from '@/config/jwt.config';
import { JwtStrategy } from '@/config/jwt.strategy';


@Module({
	imports: [
		UsersModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getJwtConfig
		})
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy]
})
export class AuthModule {
}

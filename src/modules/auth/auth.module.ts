import { Module } from '@nestjs/common';

import { AuthService } from '@/modules/auth/auth.service';
import { UsersModule } from '@/modules/users/users.module';
import { AuthController } from '@/modules/auth/auth.controller';
import { JwtTokensModule } from '@/modules/auth/jwt-tokens/jwt-tokens.module';

@Module({
	imports: [UsersModule, JwtTokensModule],
	controllers: [AuthController],
	providers: [AuthService],
})

export class AuthModule {}

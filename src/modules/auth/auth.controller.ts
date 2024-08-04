import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from '@/modules/auth/auth.service';
import { SignInTelegramDto, SignUpTelegramDto } from '@/modules/auth/dto/sign-in-telegram.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@HttpCode(200)
	@Post('sign-in/telegram')
	@ApiOperation({ summary: 'Sign in with Telegram' })
	public async signInWithTelegram(@Body() dto: SignInTelegramDto) {
		return this.authService.signInWithTelegram(dto);
	}

	@HttpCode(200)
	@Post('sign-up/telegram')
	@ApiOperation({ summary: 'Sign in with Telegram' })
	public async signUpWithTelegram(@Body() dto: SignUpTelegramDto) {
		return this.authService.signUpWithTelegram(dto);
	}
}

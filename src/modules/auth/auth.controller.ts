import {Body, Controller, HttpCode, Post} from '@nestjs/common';
import {ApiOperation, ApiTags} from '@nestjs/swagger';

import {AuthService} from '@/modules/auth/auth.service';
import {TelegramDto} from '@/modules/auth/dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {
	}

	@HttpCode(200)
	@Post('sign-in/telegram')
	@ApiOperation({ summary: 'Sign in with Telegram' })
	public async signInWithTelegram(@Body() dto: TelegramDto) {
		console.log(dto);
		return this.authService.signInWithTelegram(dto);
	}
}

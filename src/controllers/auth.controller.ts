import { Body, Controller, HttpCode, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from '@/services/auth.service';
import { TelegramDto } from '@/dto/auth.dto';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {
	}

	@Post('sign-in/telegram')
	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	async signInWithTelegram(@Body() dto: TelegramDto) {

		return this.authService.signInWithTelegram(dto);
	}
}

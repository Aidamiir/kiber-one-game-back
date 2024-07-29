import { Injectable } from '@nestjs/common';

import { UsersService } from '@/modules/users/users.service';
import { UsersRepository } from '@/modules/users/users.repository';
import { AuthTelegramDto } from '@/modules/auth/dto/auth-telegram.dto';
import { JwtTokensService } from '@/modules/auth/jwt-tokens/jwt-tokens.service';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly usersRepository: UsersRepository,
		private readonly jwtTokensService: JwtTokensService,
	) {}

	public async signInWithTelegram(dto: AuthTelegramDto) {
		let user = await this.usersRepository.getByTelegramId(dto.id);

		if (!user) {
			user = await this.usersService.create(dto);
		}
		else {
			user = await this.usersService.updateUserEnergy(user.id);
		}

		const { telegramId, ...rest } = user;
		const accessToken = this.jwtTokensService.createAccessToken(user.id);

		return {
			user: rest,
			accessToken,
		};
	}
}

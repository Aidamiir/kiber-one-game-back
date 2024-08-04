import { Injectable, NotFoundException } from '@nestjs/common';

import { UsersService } from '@/modules/users/users.service';
import { UsersRepository } from '@/modules/users/users.repository';
import { SignInTelegramDto, SignUpTelegramDto } from '@/modules/auth/dto/sign-in-telegram.dto';
import { JwtTokensService } from '@/modules/auth/jwt-tokens/jwt-tokens.service';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly usersRepository: UsersRepository,
		private readonly jwtTokensService: JwtTokensService,
	) {}

	public async signInWithTelegram(dto: SignInTelegramDto) {
		let user = await this.usersRepository.getByTelegramId(dto.id);

		if (!user) throw new NotFoundException('User not found');

		user = await this.usersService.updateUserEnergy(user.id);

		const { id } = user;
		const accessToken = this.jwtTokensService.createAccessToken(user.id);

		return {
			id,
			accessToken,
		};
	}

	public async signUpWithTelegram(dto: SignUpTelegramDto) {
		const user = await this.usersRepository.create(dto);

		if (!user) throw Error('Error creating user');

		const { id } = user;
		const accessToken = this.jwtTokensService.createAccessToken(user.id);

		return {
			id,
			accessToken,
		};
	}
}

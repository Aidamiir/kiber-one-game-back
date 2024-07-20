import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as CryptoJS from 'crypto-js';

import { UsersService } from '@/services/users.service';
import { TelegramDto } from '@/dto/auth.dto';

@Injectable()
export class AuthService {
	constructor(
		private jwtService: JwtService,
		private usersService: UsersService,
		private configService: ConfigService,
	) {}

	async signInWithTelegram(dto: TelegramDto) {
		let user = await this.usersService.getByTelegramId(dto.id);

		if (!user) {
			user = await this.usersService.create(dto);
		} else {
			// Восстанавливаем энергию при входе
			user = await this.usersService.updateUserEnergy(user.id);
		}

		const { telegram_id, last_energy_update, ...rest } = user;
		const accessToken = this.createAccessToken(user.id);

		return {
			user: rest,
			accessToken,
		};
	}

	private createAccessToken(userId: string) {
		const payload = { id: userId };
		return this.jwtService.sign(payload, { expiresIn: '1d' });
	}
}

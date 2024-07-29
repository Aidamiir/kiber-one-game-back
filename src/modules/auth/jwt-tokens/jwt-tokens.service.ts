import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtTokensService {
	private readonly EXPIRES_IN = '1d';

	constructor(private readonly jwtService: JwtService) {}

	public createAccessToken(userId: string) {
		const payload = { id: userId };
		return this.jwtService.sign(payload, { expiresIn: this.EXPIRES_IN });
	}
}

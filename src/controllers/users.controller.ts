import { Controller, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { UsersService } from '@/services/users.service';

// todo: переделать catch

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {
	}

	@Get('top-user')
	async getTopUserByCoins() {
		try {
			return await this.usersService.getTopUserByCoins();
		}
		catch (error) {
			throw new HttpException(
				{ status: HttpStatus.NOT_FOUND, error: error.message },
				HttpStatus.NOT_FOUND,
			);
		}
	}

	@Post('use-energy-boost/:id')
	async useEnergyBoost(@Param('id') id: string) {
		try {
			return await this.usersService.useEnergyBoost(id);
		}
		catch (error) {
			throw new HttpException(
				{ status: HttpStatus.BAD_REQUEST, error: error.message },
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	@Post('use-turbo-boost/:id')
	async useRocketBoost(@Param('id') id: string) {
		try {
			return await this.usersService.useTurboBoost(id);
		}
		catch (error) {
			throw new HttpException(
				{ status: HttpStatus.BAD_REQUEST, error: error.message },
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	@Post('restore-boosts/:id')
	async restoreBoosts(@Param('id') id: string) {
		try {
			return await this.usersService.restoreBoosts(id);
		}
		catch (error) {
			throw new HttpException(
				{ status: HttpStatus.INTERNAL_SERVER_ERROR, error: error.message },
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Post('upgrade-multitap/:id')
	async upgradeMultitap(@Param('id') id: string) {
		return await this.usersService.upgradeMultitap(id);
	}

	@Post('upgrade-energy-limit/:id')
	async upgradeEnergyLimit(@Param('id') id: string) {
		return await this.usersService.upgradeEnergyLimit(id);
	}
}

import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UsersService } from '@/modules/users/users.service';
import { UserUseBoostDto } from '@/modules/users/dto/user-use-boost.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@HttpCode(200)
	@Get('top-user')
	@ApiOperation({ summary: 'Get the top user by coins' })
	public async getTopUserByCoins() {
		return this.usersService.getTopUserByCoins();
	}

	@HttpCode(200)
	@Post('use-energy-boost')
	@ApiOperation({ summary: 'Use energy boost' })
	public async useEnergyBoost(@Body() dto: UserUseBoostDto) {
		return this.usersService.useEnergyBoost(dto.id);
	}

	@HttpCode(200)
	@Post('use-turbo-boost')
	@ApiOperation({ summary: 'Use turbo boost' })
	public async useTurboBoost(@Body() dto: UserUseBoostDto) {
		return this.usersService.useTurboBoost(dto.id);
	}

	@HttpCode(200)
	@Post('restore-boosts')
	@ApiOperation({ summary: 'Restore boosts' })
	public async restoreBoosts(@Body() dto: UserUseBoostDto) {
		return this.usersService.restoreBoosts(dto.id);
	}

	@HttpCode(200)
	@Post('upgrade-multitap')
	@ApiOperation({ summary: 'Upgrade multitap' })
	public async upgradeMultitap(@Body() dto: UserUseBoostDto) {
		return this.usersService.upgradeMultitap(dto.id);
	}

	@HttpCode(200)
	@Post('upgrade-energy-limit')
	@ApiOperation({ summary: 'Upgrade energy limit' })
	public async upgradeEnergyLimit(@Body() dto: UserUseBoostDto) {
		return this.usersService.upgradeEnergyLimit(dto.id);
	}
}

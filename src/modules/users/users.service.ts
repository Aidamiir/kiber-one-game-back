import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '@/modules/users/users.repository';

@Injectable()
export class UsersService {
	private readonly MULTITAP_PRICE_COEFFICIENT = 2.5;
	private readonly ENERGY_LIMIT_PRICE_COEFFICIENT = 1.5;
	private readonly MAX_ENERGY_INCREASE_FACTOR = 1.1;
	private readonly BOOST_DURATION_MS = 10000;
	private readonly ONE_HOUR_MS = 60 * 60 * 1000;
	private readonly ONE_DAY_MS = 24 * this.ONE_HOUR_MS;

	constructor(
		private readonly usersRepository: UsersRepository,
	) {}

	public async getUserById(userId: string) {
		const user = await this.usersRepository.getById(userId);
		if (!user) throw new NotFoundException('User not found');
		return user;
	}

	public async upgradeMultitap(userId: string) {
		return this.usersRepository.$transaction(async (prisma) => {
			const user = await this.getUserById(userId);
			if (user.balance.balance < user.upgrades.multitapPrice) throw new BadRequestException('Insufficient funds');

			return await this.usersRepository.upgradeMultitap(prisma, userId, {
				multitapLevel: user.upgrades.multitapLevel + 1,
				balance: user.balance.balance - user.upgrades.multitapPrice,
				multitapPrice: Math.floor(user.upgrades.multitapPrice * this.MULTITAP_PRICE_COEFFICIENT),
				balanceAmount: user.balance.balanceAmount + 1,
				energyAmount: user.energy.energyAmount + 1,
			});
		});
	}

	public async upgradeEnergyLimit(userId: string) {
		return this.usersRepository.$transaction(async (prisma) => {
			const user = await this.getUserById(userId);
			if (user.balance.balance < user.upgrades.energyLimitPrice) throw new BadRequestException('Insufficient funds');

			return await this.usersRepository.upgradeEnergyLimit(prisma, userId, {
				energyLimitLevel: user.upgrades.energyLimitLevel + 1,
				energyLimitPrice: Math.floor(user.upgrades.energyLimitPrice * this.ENERGY_LIMIT_PRICE_COEFFICIENT),
				balance: user.balance.balance - user.upgrades.energyLimitPrice,
				maxEnergy: Math.floor(user.energy.maxEnergy * this.MAX_ENERGY_INCREASE_FACTOR),
			});
		});
	}

	public async updateUserEnergy(userId: string) {
		return this.usersRepository.$transaction(async (prisma) => {
			const user = await this.getUserById(userId);
			const secondsSinceLastUpdate = (Date.now() - new Date(user.energy.lastEnergyUpdate).getTime()) / 1000;
			const recoveryAmount = Math.floor(secondsSinceLastUpdate / 2) * user.energy.energyRecoveryAmount;
			const energy = Math.min(user.energy.energy + recoveryAmount, user.energy.maxEnergy);

			return await this.usersRepository.updateUser(prisma, {
				id: userId,
				energy,
				lastEnergyUpdate: new Date(),
			});
		});
	}

	public async getTopUserByCoins() {
		const user = await this.usersRepository.getTopUserByCoins();
		if (!user) throw new NotFoundException('Users not found');

		return {
			firstName: user.firstName,
			lastName: user.lastName,
			balance: user.balance.balance,
		};
	}

	public async useEnergyBoost(userId: string) {
		return this.usersRepository.$transaction(async (prisma) => {
			const user = await this.getUserById(userId);
			if (user.boosts.quantityEnergyBoost <= 0) throw new BadRequestException('No available energy boosts');

			const { quantityEnergyBoost } = await this.usersRepository.useEnergyBoost(prisma, userId, user.energy.maxEnergy);
			return { quantityEnergyBoost };
		});
	}

	public async useTurboBoost(userId: string) {
		const user = await this.getUserById(userId);

		if (user.boosts.isTurboBoostActive) throw new BadRequestException('Turbo boost is already active');
		if (user.boosts.quantityTurboBoost <= 0) throw new BadRequestException('No available turbo boosts');

		const updatedUser = await this.usersRepository.$transaction(async (prisma) => {
			return await this.usersRepository.activateTurboBoost(prisma, userId);
		});

		setTimeout(async () => {
			try {
				await this.usersRepository.deactivateTurboBoost(userId, user.balance.balanceAmount, user.energy.energyAmount);
			}
			catch {}
		}, this.BOOST_DURATION_MS);

		return { quantityTurboBoost: updatedUser.boosts.quantityTurboBoost - 1 };
	}

	public async restoreBoosts(userId: string) {
		return this.usersRepository.$transaction(async (prisma) => {
			const user = await this.getUserById(userId);
			const now = new Date();
			const secondsSinceLastEnergyBoost = (now.getTime() - new Date(user.boosts.lastEnergyBoostUpdate).getTime()) / 1000;
			const secondsSinceLastTurboBoost = (now.getTime() - new Date(user.boosts.lastTurboBoostUpdate).getTime()) / 1000;

			const energyBoostTimeLeft = this.ONE_DAY_MS - secondsSinceLastEnergyBoost * 1000;
			const turboBoostTimeLeft = this.ONE_DAY_MS - secondsSinceLastTurboBoost * 1000;

			const oneDayPassedEnergy = secondsSinceLastEnergyBoost >= this.ONE_DAY_MS / 1000;
			const oneDayPassedTurbo = secondsSinceLastTurboBoost >= this.ONE_DAY_MS / 1000;

			const updatedUser = await this.usersRepository.updateUser(prisma, {
				id: userId,
				quantityEnergyBoost: oneDayPassedEnergy ? user.boosts.maxQuantityEnergyBoost : user.boosts.quantityEnergyBoost,
				quantityTurboBoost: oneDayPassedTurbo ? user.boosts.maxQuantityTurboBoost : user.boosts.quantityTurboBoost,
				lastEnergyBoostUpdate: now,
				lastTurboBoostUpdate: now,
			});

			return {
				quantityEnergyBoost: updatedUser.boosts.quantityEnergyBoost,
				quantityTurboBoost: updatedUser.boosts.quantityTurboBoost,
				energyBoostTimeLeft: oneDayPassedEnergy ? 0 : Math.max(0, Math.floor(energyBoostTimeLeft / this.ONE_HOUR_MS)),
				turboBoostTimeLeft: oneDayPassedTurbo ? 0 : Math.max(0, Math.floor(turboBoostTimeLeft / this.ONE_HOUR_MS)),
			};
		});
	}

	public async getUserEnergy(userId: string) {
		const { energy } = await this.getUserById(userId);
		return energy.energy;
	}
}

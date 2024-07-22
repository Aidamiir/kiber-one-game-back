import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '@/modules/users/users.repository';
import { TelegramDto } from '@/modules/auth/dto/auth.dto';
import {
	BOOST_DURATION_MS,
	ENERGY_LIMIT_PRICE_COEFFICIENT,
	MAX_ENERGY_INCREASE_FACTOR,
	MULTITAP_PRICE_COEFFICIENT,
	ONE_DAY_MS,
} from '@/modules/users/users.constants';

@Injectable()
export class UsersService {
	constructor(private readonly usersRepository: UsersRepository) {
	}

	public async getById(id: string) {
		const user = await this.usersRepository.getById(id);

		if (!user) throw new NotFoundException('User not found');

		return user;
	}

	public async getByTelegramId(telegramId: number) {
		return await this.usersRepository.getByTelegramId(telegramId);
	}

	public async create(dto: TelegramDto) {
		return await this.usersRepository.create(dto);
	}

	public async upgradeMultitap(userId: string) {
		return this.usersRepository.$transaction(async (prisma) => {
			const user = await this.getById(userId);

			if (user.balance < user.multitapPrice) {
				throw new BadRequestException('Insufficient funds');
			}

			const data = {
				multitapLevel: user.multitapLevel + 1,
				balance: user.balance - user.multitapPrice,
				multitapPrice: Math.floor(user.multitapPrice * MULTITAP_PRICE_COEFFICIENT),
				balanceAmount: user.balanceAmount + 1,
				energyAmount: user.energyAmount + 1,
			};

			return await this.usersRepository.upgradeMultitap(prisma, userId, data);
		});
	}

	public async upgradeEnergyLimit(userId: string) {
		return this.usersRepository.$transaction(async (prisma) => {
			const user = await this.getById(userId);

			if (user.balance < user.energyLimitPrice) {
				throw new BadRequestException('Insufficient funds');
			}

			const data = {
				energyLimitLevel: user.energyLimitLevel + 1,
				energyLimitPrice: Math.floor(user.energyLimitPrice * ENERGY_LIMIT_PRICE_COEFFICIENT),
				balance: user.balance - user.energyLimitPrice,
				maxEnergy: Math.floor(user.maxEnergy * MAX_ENERGY_INCREASE_FACTOR),
			};

			return await this.usersRepository.upgradeEnergyLimit(
				prisma,
				userId,
				data,
			);
		});
	}

	public async updateUserEnergy(userId: string) {
		return this.usersRepository.$transaction(async (prisma) => {
			const user = await this.getById(userId);
			const lastEnergyUpdate = new Date();
			const secondsSinceLastUpdate = (lastEnergyUpdate.getTime() - new Date(user.lastEnergyUpdate).getTime()) / 1000;
			const recoveryAmount = Math.floor(secondsSinceLastUpdate / 2) * user.energyRecoveryAmount;
			const energy = Math.min(user.energy + recoveryAmount, user.maxEnergy);

			return await this.usersRepository.updateUser(prisma, {
				id: userId,
				energy,
				lastEnergyUpdate,
			});
		});
	}

	public async getTopUserByCoins() {
		const user = await this.usersRepository.getTopUserByCoins();
		const { firstName, lastName, balance } = user;

		if (!user) {
			throw new NotFoundException('Users not found');
		}

		return {
			firstName,
			lastName,
			balance,
		};
	}

	public async useEnergyBoost(userId: string) {
		return this.usersRepository.$transaction(async (prisma) => {
			const user = await this.getById(userId);

			if (user.quantityEnergyBoost <= 0) {
				throw new BadRequestException('No available energy boosts');
			}

			const { quantityEnergyBoost } = await this.usersRepository.useEnergyBoost(prisma, userId, user.maxEnergy);

			return {
				quantityEnergyBoost,
			};
		});
	}

	public async useTurboBoost(userId: string) {
		return this.usersRepository.$transaction(async (prisma) => {
			const user = await this.getById(userId);

			if (user.isTurboBoostActive) {
				throw new BadRequestException('Turbo boost is already active');
			}

			if (user.quantityTurboBoost <= 0) {
				throw new BadRequestException('No available turbo boosts');
			}

			const originalBalanceAmount = user.balanceAmount;
			const originalEnergyAmount = user.energyAmount;

			await this.usersRepository.activateTurboBoost(prisma, userId);

			await new Promise<void>((resolve) => {
				setTimeout(async () => {
					await this.usersRepository.deactivateTurboBoost(prisma, userId, originalBalanceAmount, originalEnergyAmount);
					resolve();
				}, BOOST_DURATION_MS);
			});

			return {
				quantityTurboBoost: user.quantityTurboBoost - 1,
			};
		});
	}

	public async restoreBoosts(userId: string) {
		return this.usersRepository.$transaction(async (prisma) => {
			const user = await this.getById(userId);
			const now = new Date();
			const lastEnergyBoostUpdate = new Date(user.lastEnergyBoostUpdate);
			const lastTurboBoostUpdate = new Date(user.lastTurboBoostUpdate);

			const secondsSinceLastEnergyBoost = (now.getTime() - lastEnergyBoostUpdate.getTime()) / 1000;
			const secondsSinceLastTurboBoost = (now.getTime() - lastTurboBoostUpdate.getTime()) / 1000;

			const energyBoostTimeLeft = ONE_DAY_MS - secondsSinceLastEnergyBoost * 1000;
			const turboBoostTimeLeft = ONE_DAY_MS - secondsSinceLastTurboBoost * 1000;

			const oneDayPassedEnergy = secondsSinceLastEnergyBoost >= ONE_DAY_MS / 1000;
			const oneDayPassedTurbo = secondsSinceLastTurboBoost >= ONE_DAY_MS / 1000;

			const { quantityEnergyBoost, quantityTurboBoost } = await this.usersRepository.updateUser(prisma, {
				id: userId,
				quantityEnergyBoost: oneDayPassedEnergy ? user.maxQuantityEnergyBoost : user.quantityEnergyBoost,
				quantityTurboBoost: oneDayPassedTurbo ? user.maxQuantityTurboBoost : user.quantityTurboBoost,
				lastEnergyBoostUpdate: now,
				lastTurboBoostUpdate: now,
			});

			return {
				quantityEnergyBoost,
				quantityTurboBoost,
				energyBoostTimeLeft: oneDayPassedEnergy ? 0 : Math.max(0, Math.floor(energyBoostTimeLeft / 3600000)),
				turboBoostTimeLeft: oneDayPassedTurbo ? 0 : Math.max(0, Math.floor(turboBoostTimeLeft / 3600000)),
			};
		});
	}

	async getUserEnergy(userId: string): Promise<number> {
		const user = await this.usersRepository.getById(userId);

		if (!user) throw new NotFoundException('User not found');

		return user.energy;
	}

	async changeBalance(userId: string): Promise<{ balance: number; energy: number }> {
		return this.usersRepository.$transaction(async (prisma) => {
			const user = await this.getById(userId);

			if (!user) throw new NotFoundException('User not found');

			if (user.energy <= 0) throw new BadRequestException('Energy is 0, cannot change balance.');

			const newEnergy = Math.max(user.energy - user.energyAmount, 0);
			const { balance, energy } = await this.usersRepository.updateUser(prisma, {
				id: userId,
				balance: user.balance + user.balanceAmount,
				energy: newEnergy,
			});

			return {
				balance,
				energy,
			};
		});
	}

	async recoverEnergy(userId: string): Promise<{ energy: number }> {
		return this.usersRepository.$transaction(async (prisma) => {
			const user = await this.getById(userId);

			if (!user) throw new NotFoundException('User not found');

			const { energy } = await this.usersRepository.updateUser(prisma, {
				id: userId,
				energy: Math.min(user.energy + user.energyRecoveryAmount, user.maxEnergy),
			});

			return {
				energy,
			};
		});
	}
}

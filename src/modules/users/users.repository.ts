import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthTelegramDto } from '@/modules/auth/dto/auth-telegram.dto';

import type { UpdateUserDataInterface } from '@/modules/users/interfaces/update-user-data.interface';
import type { UpgradeMultitapDataInterface } from '@/modules/users/interfaces/upgrade-multitap-data.interface';
import type { UpgradeEnergyLimitDataInterface } from '@/modules/users/interfaces/upgrade-energy-limit-data.interface';

@Injectable()
export class UsersRepository {
	constructor(private readonly prisma: PrismaService) {}

	public async getById(id: string) {
		return this.prisma.user.findUnique({ where: { id } });
	}

	public async getByTelegramId(telegramId: number) {
		return this.prisma.user.findUnique({ where: { telegramId } });
	}

	public async create(dto: AuthTelegramDto) {
		const { id, username, firstName, lastName } = dto;

		return this.prisma.user.create({
			data: {
				telegramId: id,
				username,
				firstName,
				lastName,
			},
		});
	}

	public async upgradeMultitap(prisma: PrismaService, userId: string, data: UpgradeMultitapDataInterface) {
		const { multitapLevel, multitapPrice, balance, balanceAmount, energyAmount } = data;

		return prisma.user.update({
			where: { id: userId },
			data: {
				multitapLevel,
				balance,
				multitapPrice,
				balanceAmount,
				energyAmount,
			},
		});
	}

	public async upgradeEnergyLimit(prisma: PrismaService, userId: string, data: UpgradeEnergyLimitDataInterface) {
		const { energyLimitLevel, energyLimitPrice, maxEnergy, balance } = data;

		return prisma.user.update({
			where: { id: userId },
			data: {
				energyLimitLevel,
				energyLimitPrice,
				balance,
				maxEnergy,
			},
		});
	}

	public async getTopUserByCoins() {
		return this.prisma.user.findFirst({
			orderBy: { balance: 'desc' },
			take: 1,
		});
	}

	public async useEnergyBoost(prisma: PrismaService, userId: string, maxEnergy: number) {
		return prisma.user.update({
			where: { id: userId },
			data: {
				energy: maxEnergy,
				quantityEnergyBoost: { decrement: 1 },
			},
		});
	}

	public async activateTurboBoost(prisma: PrismaService, userId: string) {
		return prisma.user.update({
			where: { id: userId },
			data: {
				quantityTurboBoost: { decrement: 1 },
				balanceAmount: { multiply: 3 },
				energyAmount: 0,
				isTurboBoostActive: true,
			},
		});
	}

	public async deactivateTurboBoost(prisma: PrismaService, userId: string, originalBalanceAmount: number, originalEnergyAmount: number) {
		return prisma.user.update({
			where: { id: userId },
			data: {
				balanceAmount: originalBalanceAmount,
				energyAmount: originalEnergyAmount,
				isTurboBoostActive: false,
			},
		});
	}

	public async updateUser(prisma: PrismaService, data: UpdateUserDataInterface) {
		return prisma.user.update({
			where: { id: data.id },
			data: data,
		});
	}

	public async $transaction<T>(fn: (prisma: PrismaService) => Promise<T>): Promise<T> {
		return this.prisma.$transaction(fn);
	}
}

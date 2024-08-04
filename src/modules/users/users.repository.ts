import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { PrismaService } from '@/modules/prisma/prisma.service';
import { SignInTelegramDto } from '@/modules/auth/dto/sign-in-telegram.dto';

import type { UpdateUserDataInterface } from '@/modules/users/interfaces/update-user-data.interface';
import type { UpgradeMultitapDataInterface } from '@/modules/users/interfaces/upgrade-multitap-data.interface';
import type { UpgradeEnergyLimitDataInterface } from '@/modules/users/interfaces/upgrade-energy-limit-data.interface';

@Injectable()
export class UsersRepository {
	constructor(private readonly prisma: PrismaService) {}

	public async getById(id: string) {
		return this.prisma.user.findUnique({
			where: { id },
			include: {
				balance: true,
				energy: true,
				boosts: true,
				upgrades: true,
			},
		});
	}

	public async getByTelegramId(telegramId: number): Promise<User | null> {
		return this.prisma.user.findUnique({
			where: { telegramId },
			include: {
				balance: true,
				energy: true,
				boosts: true,
				upgrades: true,
			},
		});
	}

	public async create(dto: SignInTelegramDto): Promise<User> {
		const { id, username, firstName, lastName } = dto;

		return this.prisma.user.create({
			data: {
				telegramId: id,
				username,
				firstName,
				lastName,
				balance: {
					create: {},
				},
				energy: {
					create: {},
				},
				boosts: {
					create: {},
				},
				upgrades: {
					create: {},
				},
			},
			include: {
				balance: true,
				energy: true,
				boosts: true,
				upgrades: true,
			},
		});
	}

	public async upgradeMultitap(prisma: PrismaService, userId: string, data: UpgradeMultitapDataInterface) {
		const { multitapLevel, multitapPrice, balance, balanceAmount, energyAmount } = data;

		await prisma.balance.update({
			where: { userId },
			data: { balance, balanceAmount },
		});

		await prisma.energy.update({
			where: { userId },
			data: { energyAmount },
		});

		return prisma.upgrades.update({
			where: { userId },
			data: { multitapLevel, multitapPrice },
		});
	}

	public async upgradeEnergyLimit(prisma: PrismaService, userId: string, data: UpgradeEnergyLimitDataInterface) {
		const { energyLimitLevel, energyLimitPrice, maxEnergy, balance } = data;

		await prisma.balance.update({
			where: { userId },
			data: { balance },
		});

		await prisma.energy.update({
			where: { userId },
			data: { maxEnergy },
		});

		return prisma.upgrades.update({
			where: { userId },
			data: { energyLimitLevel, energyLimitPrice },
		});
	}

	public async getTopUserByCoins() {
		return this.prisma.user.findFirst({
			orderBy: {
				balance: {
					balance: 'desc',
				},
			},
			include: {
				balance: true,
			},
		});
	}

	public async useEnergyBoost(prisma: PrismaService, userId: string, maxEnergy: number): Promise<{ quantityEnergyBoost: number }> {
		await prisma.energy.update({
			where: { userId },
			data: { energy: maxEnergy },
		});

		const { quantityEnergyBoost } = await prisma.boosts.update({
			where: { userId },
			data: { quantityEnergyBoost: { decrement: 1 } },
			select: { quantityEnergyBoost: true },
		});

		return { quantityEnergyBoost };
	}

	public async activateTurboBoost(prisma: PrismaService, userId: string) {
		await prisma.boosts.update({
			where: { userId },
			data: {
				quantityTurboBoost: { decrement: 1 },
				isTurboBoostActive: true,
			},
		});

		await prisma.balance.update({
			where: { userId },
			data: { balanceAmount: { multiply: 3 } },
		});

		await prisma.energy.update({
			where: { userId },
			data: { energyAmount: 0 },
		});

		return this.prisma.user.findUnique({
			where: { id: userId },
			include: {
				balance: true,
				energy: true,
				boosts: true,
				upgrades: true,
			},
		});
	}

	public async deactivateTurboBoost( userId: string, originalBalanceAmount: number, originalEnergyAmount: number) {
		await this.prisma.boosts.update({
			where: { userId },
			data: { isTurboBoostActive: false },
		});

		await this.prisma.balance.update({
			where: { userId },
			data: { balanceAmount: originalBalanceAmount },
		});

		await this.prisma.energy.update({
			where: { userId },
			data: { energyAmount: originalEnergyAmount },
		});
	}

	public async updateUser(prisma: PrismaService, data: UpdateUserDataInterface) {
		const { id, ...updateData } = data;
		const updatePromises: Promise<any>[] = [];

		if (updateData.balance !== undefined) {
			updatePromises.push(
				prisma.balance.update({
					where: { userId: id },
					data: { balance: updateData.balance },
				})
			);
		}

		if (updateData.energy !== undefined) {
			updatePromises.push(
				prisma.energy.update({
					where: { userId: id },
					data: { energy: updateData.energy, lastEnergyUpdate: updateData.lastEnergyUpdate },
				})
			);
		}

		if (updateData.quantityEnergyBoost !== undefined || updateData.lastEnergyBoostUpdate !== undefined) {
			updatePromises.push(
				prisma.boosts.update({
					where: { userId: id },
					data: {
						quantityEnergyBoost: updateData.quantityEnergyBoost,
						lastEnergyBoostUpdate: updateData.lastEnergyBoostUpdate,
					},
				})
			);
		}

		if (updateData.quantityTurboBoost !== undefined || updateData.lastTurboBoostUpdate !== undefined) {
			updatePromises.push(
				prisma.boosts.update({
					where: { userId: id },
					data: {
						quantityTurboBoost: updateData.quantityTurboBoost,
						lastTurboBoostUpdate: updateData.lastTurboBoostUpdate,
					},
				})
			);
		}

		await Promise.all(updatePromises);

		return this.getById(id);
	}

	public async $transaction<T>(fn: (prisma: PrismaService) => Promise<T>): Promise<T> {
		return this.prisma.$transaction(fn);
	}
}

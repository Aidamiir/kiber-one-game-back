import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { TelegramDto } from '@/modules/auth/dto/auth.dto';

@Injectable()
export class UsersRepository {
	constructor(private readonly prisma: PrismaService) {
	}

	public async getById(id: string) {
		return this.prisma.user.findUnique({ where: { id } });
	}

	public async getByTelegramId(telegramId: number) {
		return this.prisma.user.findUnique({ where: { telegramId } });
	}

	public async create(dto: TelegramDto) {
		return this.prisma.user.create({
			data: {
				telegramId: dto.id,
				username: dto.username,
				firstName: dto.firstName,
				lastName: dto.lastName,
			},
		});
	}

	public async upgradeMultitap(prisma: PrismaService, userId: string, data: {
		multitapLevel: number,
		balance: number,
		multitapPrice: number,
		balanceAmount: number,
		energyAmount: number
	}) {
		return prisma.user.update({
			where: { id: userId },
			data: {
				multitapLevel: data.multitapLevel,
				balance: data.balance,
				multitapPrice: data.multitapPrice,
				balanceAmount: data.balanceAmount,
				energyAmount: data.energyAmount,
			},
		});
	}

	public async upgradeEnergyLimit(prisma: PrismaService, userId: string, data: {
		energyLimitLevel: number,
		energyLimitPrice: number,
		balance: number,
		maxEnergy: number
	}) {
		return prisma.user.update({
			where: { id: userId },
			data: {
				energyLimitLevel: data.energyLimitLevel,
				energyLimitPrice: data.energyLimitPrice,
				balance: data.balance,
				maxEnergy: data.maxEnergy,
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

	public async updateUser(prisma: PrismaService, data: {
		id: string;
		balance?: number;
		energy?: number;
		balanceAmount?: number;
		energyAmount?: number;
		lastEnergyUpdate?: Date;
		quantityEnergyBoost?: number;
		quantityTurboBoost?: number;
		lastEnergyBoostUpdate?: Date;
		lastTurboBoostUpdate?: Date;
	}) {
		return prisma.user.update({
			where: { id: data.id },
			data: data,
		});
	}

	public async $transaction<T>(fn: (prisma: PrismaService) => Promise<T>): Promise<T> {
		return this.prisma.$transaction(fn);
	}
}

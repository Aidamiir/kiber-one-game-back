import { PrismaService } from '@/services/prisma.service';
import { TelegramDto } from '@/dto/auth.dto';
import { Injectable } from '@nestjs/common';
import * as moment from 'moment';

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {
	}

	async getById(id: string) {
		return this.prisma.user.findUnique({
			where: {
				id,
			},
		});
	}

	async getByTelegramId(telegramId: number) {
		return this.prisma.user.findUnique({
			where: {
				telegram_id: telegramId,
			},
		});
	}

	async create(dto: TelegramDto) {
		return this.prisma.user.create({
			data: {
				telegram_id: dto.id,
				username: dto?.username,
				first_name: dto.first_name,
				last_name: dto?.last_name,
			},
		});
	}

	async upgradeMultitap(userId: string) {
		return this.prisma.$transaction(async (prisma) => {
			// Найти пользователя по ID
			const user = await prisma.user.findUnique({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			// Проверка, достаточно ли средств
			if (user.balance < user.multitap_price) {
				throw new Error('Insufficient balance');
			}

			// Обновить уровень multitap, списать монеты, обновить цену улучшения и balance_amount
			const newLevel = user.multitap_level + 1;
			const newBalance = user.balance - user.multitap_price;
			const newPrice = Math.floor(user.multitap_price * 2.5); // Пример: цена увеличивается на 50%
			const newBalanceAmount = user.balance_amount + 1; // Увеличиваем balance_amount на 1
			const newEnergyAmount = user.energy_amount + 1;

			const updatedUser = await prisma.user.update({
				where: { id: userId },
				data: {
					multitap_level: newLevel,
					balance: newBalance,
					multitap_price: newPrice,
					balance_amount: newBalanceAmount,
					energy_amount: newEnergyAmount
				},
			});

			return {
				balance: updatedUser.balance,
				multitap_level: updatedUser.multitap_level,
				multitap_price: updatedUser.multitap_price,
				balance_amount: updatedUser.balance_amount
			};
		});
	}

	async upgradeEnergyLimit(userId: string) {
		return this.prisma.$transaction(async (prisma) => {
			const user = await prisma.user.findUnique({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			// Проверка, достаточно ли средств
			if (user.balance < user.energy_limit_price) {
				throw new Error('Insufficient balance');
			}

			// Обновить уровень multitap, списать монеты, обновить цену улучшения и balance_amount
			const newLevel = user.energy_limit_level + 1;
			const newBalance = user.balance - user.energy_limit_price;
			const newPrice = Math.floor(user.energy_limit_price * 1.5); // Пример: цена увеличивается на 50%
			const newMaxEnergy = Math.floor(user.max_energy * 1.1);

			const updatedUser = await prisma.user.update({
				where: { id: userId },
				data: {
					energy_limit_level: newLevel,
					energy_limit_price: newPrice,
					balance: newBalance,
					max_energy: newMaxEnergy
				},
			});

			return {
				balance: updatedUser.balance,
				energy_limit_level: updatedUser.energy_limit_level,
				energy_limit_price: updatedUser.energy_limit_price,
				max_energy: updatedUser.max_energy
			};
		});
	}

	async updateUserEnergy(userId: string) {
		const user = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			throw new Error('User not found');
		}

		const now = moment(); // Используйте moment для текущего времени
		const lastUpdate = moment(user.last_energy_update); // Преобразование даты из базы данных
		const secondsPassed = now.diff(lastUpdate, 'seconds'); // Разница в секундах
		const recoveryAmount = Math.floor(secondsPassed / 2) * user.energy_recovery_amount; // Количество восстановленной энергии

		const newEnergy = Math.min(user.energy + recoveryAmount, user.max_energy); // Новое количество энергии

		return this.prisma.user.update({
			where: { id: userId },
			data: {
				energy: newEnergy,
				last_energy_update: now.toDate(), // Обновление времени последнего обновления
			},
		});
	}

	// Новый метод для получения самого большого обладателя монет
	async getTopUserByCoins() {
		const user = await this.prisma.user.findFirst({
			orderBy: {
				balance: 'desc', // Сортировка по количеству монет в порядке убывания
			},
			take: 1, // Возвращаем только одного пользователя
		});

		if (!user) {
			throw new Error('No users found');
		}

		const { first_name, last_name, balance } = user;

		return {
			first_name,
			last_name,
			balance,
		};
	}

	// Метод для использования энерго-бустов
	async useEnergyBoost(userId: string) {
		const user = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			throw new Error('User not found');
		}

		if (user.quantity_energy_boost <= 0) {
			throw new Error('No energy boosts left');
		}

		const { max_energy } = await this.prisma.user.findUnique({ where: { id: userId } });

		const { quantity_energy_boost } = await this.prisma.user.update({
			where: { id: userId },
			data: {
				energy: max_energy,
				quantity_energy_boost: user.quantity_energy_boost - 1,
			},
		});

		return { quantity_energy_boost };
	}

	async useTurboBoost(userId: string) {
		const user = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			throw new Error('User not found');
		}

		if (user.is_turbo_boost_active) {
			throw new Error('Turbo boost is already active');
		}

		if (user.quantity_turbo_boost <= 0) {
			throw new Error('No rocket boosts left');
		}

		const originalBalanceAmount = user.balance_amount;
		const originalEnergyAmount = user.energy_amount;
		const boostedBalanceAmount = user.balance_amount * 3;

		// Обновляем количество ракетных бустов, баланс, энергию и устанавливаем статус буста
		await this.prisma.user.update({
			where: { id: userId },
			data: {
				quantity_turbo_boost: user.quantity_turbo_boost - 1,
				balance_amount: boostedBalanceAmount,
				energy_amount: 0,
				is_turbo_boost_active: true,
			},
		});

		// Устанавливаем таймаут на 10 секунд, после которого возвращаем прежние значения и сбрасываем статус буста
		setTimeout(async () => {
			await this.prisma.user.update({
				where: { id: userId },
				data: {
					balance_amount: originalBalanceAmount,
					energy_amount: originalEnergyAmount,
					is_turbo_boost_active: false,
				},
			});
		}, 10000);

		return {
			message: 'Turbo boost applied for 10 seconds',
			quantity_turbo_boost: user.quantity_turbo_boost - 1,
		};
	}

	async restoreBoosts(userId: string) {
		const user = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			throw new Error('User not found');
		}

		const now = moment();
		const lastEnergyBoostUpdate = moment(user.last_energy_boost_update);
		const lastTurboBoostUpdate = moment(user.last_turbo_boost_update);

		const oneDayInSeconds = 24 * 60 * 60;

		const secondsSinceLastEnergyBoost = now.diff(lastEnergyBoostUpdate, 'seconds');
		const secondsSinceLastTurboBoost = now.diff(lastTurboBoostUpdate, 'seconds');

		const energyBoostTimeLeft = oneDayInSeconds - secondsSinceLastEnergyBoost;
		const turboBoostTimeLeft = oneDayInSeconds - secondsSinceLastTurboBoost;

		const oneDayPassedEnergy = secondsSinceLastEnergyBoost >= oneDayInSeconds;
		const oneDayPassedTurbo = secondsSinceLastTurboBoost >= oneDayInSeconds;

		const { quantity_energy_boost, quantity_turbo_boost } = await this.prisma.user.update({
			where: { id: userId },
			data: {
				quantity_energy_boost: oneDayPassedEnergy ? user.max_quantity_energy_boost : user.quantity_energy_boost,
				quantity_turbo_boost: oneDayPassedTurbo ? user.max_quantity_turbo_boost : user.quantity_turbo_boost,
				last_energy_boost_update: oneDayPassedEnergy ? now.toDate() : user.last_energy_boost_update,
				last_turbo_boost_update: oneDayPassedTurbo ? now.toDate() : user.last_turbo_boost_update,
			},
		});

		return {
			quantity_energy_boost,
			quantity_turbo_boost,
			energy_boost_time_left: oneDayPassedEnergy ? 0 : Math.max(0, Math.floor(energyBoostTimeLeft / 3600)), // Оставшееся время в часах (целое число)
			turbo_boost_time_left: oneDayPassedTurbo ? 0 : Math.max(0, Math.floor(turboBoostTimeLeft / 3600)), // Оставшееся время в часах (целое число)
		};
	}
}

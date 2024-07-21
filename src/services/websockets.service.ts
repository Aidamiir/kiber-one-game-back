import { Injectable } from '@nestjs/common'
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { PrismaClient } from '@prisma/client'
import { Server, Socket } from 'socket.io'

@Injectable()
@WebSocketGateway({
	cors: {
		origin: ['http://localhost:3000', 'http://localhost:4173', 'https://kiber-one-game.ru'],
		methods: ['GET', 'POST'],
		credentials: true,
	},
})
export class WebsocketsService implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer() server: Server;
	private prisma = new PrismaClient();

	async handleConnection(client: Socket) {
		const userId = client.handshake.query.userId as string;
		if (userId) {
			try {
				console.log(userId, 'userId');
				const user = await this.prisma.user.findUnique({ where: { id: userId } });
				if (user) {
					client.emit('updateEnergy', user.energy);
				} else {
					client.emit('error', 'User not found');
				}
			}
			catch (error) {
				client.emit('error', 'Error fetching user data');
			}
		}
	}

	async handleDisconnect(client: Socket) {
		console.log(`Client disconnected: ${client.id}`);
	}

	@SubscribeMessage('changeBalance')
	async handleChangeBalance(client: Socket, payload: { id: string }) {
		try {
			const { balance_amount, ...user } = await this.prisma.user.findUnique({ where: { id: payload.id } });
			if (user) {
				if (user.energy <= 0) {
					client.emit('error', 'Energy is 0, cannot change balance.');
					return;
				}

				// Обновляем количество энергии и баланс
				const newEnergy = Math.max(user.energy - user.energy_amount, 0);
				const updatedUser = await this.prisma.user.update({
					where: { id: payload.id },
					data: {
						balance: user.balance + balance_amount,
						energy: newEnergy,
					},
				});

				console.log(updatedUser.balance, updatedUser.energy);
				client.emit('updateCoins', updatedUser.balance, balance_amount);
				client.emit('updateEnergy', updatedUser.energy);
			} else {
				client.emit('error', 'User not found');
			}
		}
		catch (error) {
			client.emit('error', 'Error updating balance or energy');
		}
	}

	@SubscribeMessage('recoverEnergy')
	async handleRecoverEnergy(client: Socket, payload: { id: string }) {
		try {
			const user = await this.prisma.user.findUnique({ where: { id: payload.id } });
			if (user) {
				// Увеличиваем энергию пользователя
				const updatedUser = await this.prisma.user.update({
					where: { id: payload.id },
					data: {
						energy: Math.min(user.energy + user.energy_recovery_amount, user.max_energy), // max_energy - максимальное количество энергии
					},
				});
				client.emit('updateEnergy', updatedUser.energy);
			} else {
				client.emit('error', 'User not found');
			}
		}
		catch (error) {
			client.emit('error', 'Error recovering energy');
		}
	}
}

import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { UsersService } from '@/modules/users/users.service';
import { UsersRepository } from '@/modules/users/users.repository';

// todo: проставить префикс и брать origins из env
@Injectable()
@WebSocketGateway({
	cors: {
		origin: [
			'http://localhost:3000',
			'http://localhost:4173',
			'https://kiber-one-game.ru'
		],
		methods: ['GET', 'POST'],
		credentials: true,
	},
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer() server: Server;

	constructor(
		private readonly usersService: UsersService,
		private readonly usersRepository: UsersRepository
	) {}

	async handleConnection(client: Socket) {
		const userId = client.handshake.query.userId as string;
		if (userId) {
			try {
				const energy = await this.usersService.getUserEnergy(userId);
				client.emit('updateEnergy', energy);
			} catch (error) {
				client.emit('error', error.message);
			}
		}
	}

	async handleDisconnect(client: Socket) {
		console.log(`Client disconnected: ${client.id}`);
	}

	@SubscribeMessage('changeBalance')
	async handleChangeBalance(client: Socket, payload: { id: string }) {
		try {
			const updatedUser = await this.changeBalance(payload.id);
			client.emit('updateCoins', updatedUser.balance);
			client.emit('updateEnergy', updatedUser.energy);
		} catch (error) {
			client.emit('error', error.message);
		}
	}

	@SubscribeMessage('recoverEnergy')
	async handleRecoverEnergy(client: Socket, payload: { id: string }) {
		try {
			const updatedUser = await this.recoverEnergy(payload.id);
			client.emit('updateEnergy', updatedUser.energy);
		} catch (error) {
			client.emit('error', error.message);
		}
	}

	private async changeBalance(userId: string) {
		return this.usersRepository.$transaction(async (prisma) => {
			const user = await this.usersService.getUserById(userId);
			if (user.energy.energy <= 0) throw new BadRequestException('Energy is 0, cannot change balance.');

			const newEnergy = Math.max(user.energy.energy - user.energy.energyAmount, 0);
			const updatedUser = await this.usersRepository.updateUser(prisma, {
				id: userId,
				balance: user.balance.balance + user.balance.balanceAmount,
				energy: newEnergy,
			});

			return { balance: updatedUser.balance.balance, energy: updatedUser.energy.energy };
		});
	}

	private async recoverEnergy(userId: string) {
		return this.usersRepository.$transaction(async (prisma) => {
			const user = await this.usersService.getUserById(userId);
			const energy = Math.min(user.energy.energy + user.energy.energyRecoveryAmount, user.energy.maxEnergy);
			const updatedUser = await this.usersRepository.updateUser(prisma, {
				id: userId,
				energy,
			});

			return { energy: updatedUser.energy.energy };
		});
	}
}

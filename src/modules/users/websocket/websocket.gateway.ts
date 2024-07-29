import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { UsersService } from '@/modules/users/users.service';

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

	constructor(private readonly usersService: UsersService) {}

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
			const updatedUser = await this.usersService.changeBalance(payload.id);
			client.emit('updateCoins', updatedUser.balance);
			client.emit('updateEnergy', updatedUser.energy);
		} catch (error) {
			client.emit('error', error.message);
		}
	}

	@SubscribeMessage('recoverEnergy')
	async handleRecoverEnergy(client: Socket, payload: { id: string }) {
		try {
			const updatedUser = await this.usersService.recoverEnergy(payload.id);
			client.emit('updateEnergy', updatedUser.energy);
		} catch (error) {
			client.emit('error', error.message);
		}
	}
}

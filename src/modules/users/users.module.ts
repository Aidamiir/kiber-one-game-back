import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { PrismaModule } from '@/modules/prisma/prisma.module';
import { UsersService } from '@/modules/users/users.service';
import { UsersController } from '@/modules/users/users.controller';
import { UsersRepository } from '@/modules/users/users.repository';

@Module({
	controllers: [UsersController],
	providers: [UsersRepository, UsersService],
	exports: [UsersService, UsersRepository],
	imports: [
		PrismaModule,
		BullModule.registerQueue({
			name: 'boost',
		}),
	],
})
export class UsersModule {}

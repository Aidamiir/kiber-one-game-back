import { Module } from '@nestjs/common';

import { UsersRepository } from '@/modules/users/users.repository';
import { UsersService } from '@/modules/users/users.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { UsersController } from '@/modules/users/users.controller';

@Module({
	controllers: [UsersController],
	providers: [UsersRepository, UsersService, PrismaService],
	exports: [UsersService],
})
export class UsersModule {
}

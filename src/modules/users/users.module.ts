import { Module } from '@nestjs/common';

import { PrismaModule } from '@/modules/prisma/prisma.module';
import { UsersService } from '@/modules/users/users.service';
import { UsersController } from '@/modules/users/users.controller';
import { UsersRepository } from '@/modules/users/users.repository';

@Module({
	controllers: [UsersController],
	providers: [UsersRepository, UsersService],
	exports: [UsersService, UsersRepository],
	imports: [PrismaModule]
})
export class UsersModule {}

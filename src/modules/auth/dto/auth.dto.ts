import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TelegramDto {
	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: 'id' })
	id: number;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: 'username' })
	username?: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: 'firstName' })
	firstName: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: 'lastName' })
	lastName?: string;
}

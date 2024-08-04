import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInTelegramDto {
	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: 'id' })
	id: number;
}

export class SignUpTelegramDto {
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

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: 'city' })
	city: string;
}

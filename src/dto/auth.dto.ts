import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class TelegramDto {
	@IsNumber()
	@IsNotEmpty()
	id: number;

	@IsString()
	@IsOptional()
	username?: string;

	@IsString()
	@IsNotEmpty()
	first_name: string;

	@IsString()
	@IsOptional()
	last_name?: string;
}

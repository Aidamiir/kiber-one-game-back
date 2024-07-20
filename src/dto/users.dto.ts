import { IsInt, IsPositive, IsString } from 'class-validator';

export class UsersDto {

}

export class UpdateCoinsDto {
	@IsString()
	id: string

	@IsInt()
	@IsPositive()
	balance: number;
}


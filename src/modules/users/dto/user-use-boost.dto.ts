import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserUseBoostDto {
	@IsString()
	@ApiProperty({ description: 'id' })
	id: string;
}

import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UseBoostDto {
	@IsString()
	@ApiProperty({ description: 'id' })
	readonly id: string;
}

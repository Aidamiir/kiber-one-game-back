import { UseGuards } from '@nestjs/common';
import { JwtTokensGuard } from '@/modules/auth/jwt-tokens/jwt-tokens.guard';

export const AuthDecorator = () => UseGuards(JwtTokensGuard);

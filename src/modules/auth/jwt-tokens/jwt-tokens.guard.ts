import { AuthGuard } from '@nestjs/passport';

export class JwtTokensGuard extends AuthGuard('jwt') {
}

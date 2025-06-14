import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromCookie(request);

    if (token) {
        try {
            const decoded = this.jwtService.verify(token);
            request.user = decoded;
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired access token');
        }    
    }
    return true;
  }

  private extractTokenFromCookie(request: any): string | null {
    const jwtCookie = request.cookies?.sessionUser;
    if (!jwtCookie) {
      return null;
    }
    if (jwtCookie.startsWith('Bearer ')) {
      return jwtCookie.replace('Bearer ', '');
    }

    return jwtCookie;
  }
}
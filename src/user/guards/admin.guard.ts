import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization']?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Debe contar con un token de acceso');
    }

    try {
      const decoded = this.jwtService.verify(token);
      if (!decoded?.admin) {
        throw new ForbiddenException('No tienes los permisos necesarios para acceder a este recurso');
      }
      return true;
    } catch (error) {
      throw new UnauthorizedException(error);
    }
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
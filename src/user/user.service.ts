import { Injectable, BadRequestException, HttpException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from './dto/user.dto';
import { UserResponseDto } from './dto/user.response.dto';
import { UsersDatabaseService } from '@src/database/user/user.database.service';
import { AuthenticationRequestDto } from './dto/authentication.request.dto';
import { MESSAGES } from '@constants/messages';
import { UserEntity } from '@src/database/user/user.entity';
import { ConfigService } from '@nestjs/config';
import { FastifyReply } from 'fastify';
import { clearCookie, setCookie } from '@src/utiles/cookie.utils';
import { MailerService } from '@nestjs-modules/mailer';
import { RecaptchaClient } from '@src/clients/recaptcha/recaptcha.client';
import { lastValueFrom } from 'rxjs';
import { AuthenticationResponseDto } from './dto/authentication.response.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly usersDatabaseService: UsersDatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly recaptchaClient: RecaptchaClient,
  ) {}

  status(): string {
    return 'ok';
  }

  private async findUserByEmailOrThrow(email: string, relations?: string[]): Promise<UserEntity> {
    const user = await this.usersDatabaseService.findOneEmail(email, relations);
    if (!user) {
      throw new NotFoundException(MESSAGES.USER_NOT_FOUND);
    }
    return user;
  }

  private handleException(error: any, defaultMessage: string): void {
    if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof UnauthorizedException) {
      throw error;
    }
    console.error(error);
    throw new HttpException(defaultMessage, 500);
  }

  async create(create: User, reply: FastifyReply): Promise<string> {
    try {
      const existingUser = await this.usersDatabaseService.findOneEmail(create.email);
      if (existingUser) {
        throw new BadRequestException('Email ya está en uso');
      }
      create.phone = User.formatPhoneNumber(create.phone);
      create.password = await this.hashPassword(create.password);
      const savedUser = await this.usersDatabaseService.create(create);
      const jwt = await this.generateJwt(savedUser);
      
      setCookie(reply, this.configService.get<string>('SESSION_USER'), jwt, { httpOnly: true });
      setCookie(reply, this.configService.get<string>('SESSION_INDICATOR'), '', { httpOnly: false });

      return jwt;
    } catch (e) {
      this.handleException(e, 'Error al crear el usuario');
    }
  }

  async login(user: AuthenticationRequestDto): Promise<AuthenticationResponseDto> {
    try {
      const existingUser = await this.findUserByEmailOrThrow(user.email);
      const isPasswordValid = await bcrypt.compare(user.password, existingUser.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Contraseña incorrecta');
      }
      const jwt = await this.generateJwt(existingUser);
      return new AuthenticationResponseDto(jwt, existingUser);
    } catch (e) {
      this.handleException(new UnauthorizedException(), 'Error al iniciar sesión');
    }
  }

  async logout(reply: FastifyReply): Promise<void> {
    clearCookie(reply, this.configService.get<string>('SESSION_USER'));
    clearCookie(reply, this.configService.get<string>('SESSION_INDICATOR'));
  }

  async profile(email: string): Promise<UserResponseDto> {
    try {
      const user = await this.findUserByEmailOrThrow(email);
      return new UserResponseDto(user);
    } catch (e) {
      this.handleException(e, 'Error al buscar el usuario');
    }
  }

  async makeAdmin(email: string): Promise<UserResponseDto> {
    try {
      const user = await this.findUserByEmailOrThrow(email);
      await this.usersDatabaseService.makeAdmin(user);
      return new UserResponseDto(user);
    } catch (e) {
      this.handleException(e, 'Error al hacer administrador al usuario');
    }
  }

  async update(update: User, email: string): Promise<AuthenticationResponseDto> {
    try {
      const user = await this.findUserByEmailOrThrow(email);
      update.phone = update ? User.formatPhoneNumber(update.phone) : user.phone;
      if (update.password) {
        delete update.password;
      }
      const updatedUser = await this.usersDatabaseService.update(user, update);
      const jwt = await this.generateJwt(updatedUser);
      return new AuthenticationResponseDto(jwt, updatedUser);
    } catch (e) {
      this.handleException(e, 'Error al actualizar el usuario');
    }
  }

  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.findUserByEmailOrThrow(email);

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Contraseña actual incorrecta');
      }

      const hashedPassword = await this.hashPassword(newPassword);

      const updatedUser: User = {
        ...user,
        password: hashedPassword,
      };
      await this.usersDatabaseService.update(user, updatedUser);
    } catch (e) {
      this.handleException(e, 'Error al cambiar la contraseña');
    }
  }

  async delete(email: string, userEmail: string): Promise<void> {
    try {
      const emailToDelete = email || userEmail;
      const user = await this.findUserByEmailOrThrow(emailToDelete);
      await this.usersDatabaseService.remove(user.id);
    } catch (e) {
      this.handleException(e, 'Error al eliminar el usuario');
    }
  }

  private async generateJwt(user: UserEntity): Promise<string> {
    const payload = { id: user.id, email: user.email, admin: user.admin };
    const token = await this.jwtService.signAsync(payload);
    return `Bearer ${token}`;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = +this.configService.get<string>('SALT') || 10;
    return bcrypt.hash(password, saltRounds);
  }

  async requestPasswordReset(email: string): Promise<string> {
      const user = await this.usersDatabaseService.findOneEmail(email);
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }
  
      // Generar un token de restablecimiento
      const resetToken = this.jwtService.sign(
        { userId: user.id },
        { secret: this.configService.get<string>('JWT_RESET_SECRET'), expiresIn: '1h' },
      );
  
      const resetLink = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;
      await this.mailerService.sendMail({
        to: email,
        subject: 'Restablecimiento de contraseña',
        text: `Haz clic en el siguiente enlace para restablecer tu contraseña: ${resetLink}`,
      });
  
      return 'Se ha enviado un correo para restablecer la contraseña';
    }
  
    async resetPassword(token: string, newPassword: string): Promise<string> {
      try {
        const payload = this.jwtService.verify(token, { secret: process.env.JWT_RESET_SECRET });
        const user = await this.usersDatabaseService.findOne(payload.userId);
        if (!user) {
          throw new NotFoundException('Usuario no encontrado');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersDatabaseService.update(user, { ...user, password: hashedPassword });
        return 'Contraseña restablecida correctamente';
      } catch (error) {
        throw new BadRequestException('Token inválido o expirado');
      }
    }

  async all(): Promise<UserResponseDto[]> {
    try {
      const users = await this.usersDatabaseService.findAll();
      return users.map((user) => new UserResponseDto(user));
    } catch (e) {
      this.handleException(e, 'Error al buscar los usuarios');
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await lastValueFrom(this.recaptchaClient.validateToken(token));

      return response.success;
    } catch (error) {
      console.error("Error validando reCAPTCHA:", error);
      return false;
    }
  }
}

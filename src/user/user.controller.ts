import { Controller, Get, Post, Put, Body, Query, Req, UseGuards, Delete, UsePipes, ValidationPipe, Res, HttpException, HttpStatus, } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '@user/dto/user.dto';
import { AuthenticationResponseDto } from './dto/authentication.response.dto';
import { AuthenticationRequestDto } from './dto/authentication.request.dto';
import { UserResponseDto } from './dto/user.response.dto';
import { AuthGuard } from './guards/session.guard';
import { RequestWithUser } from './interfaces/request.interface';
import { RoleGuard } from './guards/admin.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserUpdateDto } from './dto/user.update.dto';
import { CreateUser } from './dto/user.create.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Check the status of the service' })
  @ApiResponse({ status: 200, description: 'Service is OK', type: String })
  status(): string {
    return this.userService.status();
  }

  @Post('create')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: User })
  @ApiResponse({ status: 201, description: 'User created', type: AuthenticationResponseDto })
  @ApiResponse({ status: 400, description: 'Email already in use' })
  async create(
    @Body('user') user: CreateUser,
    ): Promise<AuthenticationResponseDto> {
    return await this.userService.create(user);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(
    @Body('user') user: AuthenticationRequestDto,
  ): Promise<AuthenticationResponseDto> {
    return await this.userService.login(user);
  }
  
  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiResponse({ status: 200, description: 'User profile retrieved', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async profile(@Req() request: RequestWithUser): Promise<UserResponseDto> {
    const email = request.user.email;
    return await this.userService.profile(email);
  }

  @Put('makeAdmin')
  @ApiOperation({ summary: 'Grant admin rights to a user' })
  @ApiQuery({ name: 'email', type: String })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @ApiResponse({ status: 200, description: 'User promoted to admin', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async makeAdmin(@Query('email') email: string): Promise<UserResponseDto> {
    return await this.userService.makeAdmin(email);
  }

  @Put('changePassword')
  @UseGuards(AuthGuard)
  async changePassword(
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
    @Req() request: RequestWithUser
  ): Promise<void> {
    const email = request.user.email;
    return await this.userService.changePassword(email, currentPassword, newPassword);
  }

  @Put('update') 
  @UseGuards(AuthGuard)
  async update(
    @Body('user') user: UserUpdateDto,
    @Req() request: RequestWithUser,
  ): Promise<AuthenticationResponseDto> {
    return await this.userService.update(user, request.user.email);
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Delete user' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async delete(@Query('email') email, @Req() request: RequestWithUser): Promise<void> {
    return await this.userService.delete(email, request.user.email);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string): Promise<string> {
    return this.userService.requestPasswordReset(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ): Promise<AuthenticationResponseDto> {
    return this.userService.resetPassword(token, newPassword);
  }
}


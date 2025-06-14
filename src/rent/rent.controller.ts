import { Controller, Post, Body, UsePipes, Param, Get, UseGuards, Req, UseInterceptors } from '@nestjs/common';
import { RentService } from './rent.service';
import { RentDTO } from './dto/rent.dto';
import { RentEntity } from '@databaseRent/rents.entity';
import { AuthGuard } from '@user/guards/session.guard';
import { RoleGuard } from '@src/user/guards/admin.guard';
import { EmailInterceptor } from './interceptor/email.interceptor';
import { plainToInstance } from 'class-transformer';

@Controller('rent')
export class RentController {
  constructor(private readonly rentService: RentService) {}

  @Post('create')
  @UseInterceptors(EmailInterceptor)
  async addFavorite(
    @Body('rent') rent: RentDTO,
  ): Promise<void> {
    const rentTransformed = plainToInstance(RentDTO, rent, { enableImplicitConversion: true });
    return await this.rentService.create(rentTransformed);
  }
  
  @Get('user/:id')
  async getByUser(
    @Param('id') userId: number,
  ): Promise<RentEntity[]> {
    return await this.rentService.getByUser(userId);
  }

  @Get('property/:id')
  async getByProperty(
    @Param('id') propertyId: number,
  ): Promise<RentEntity[]> {
    return await this.rentService.getByProperty(propertyId);
  }

  @Get('findToApproved')
  async findToApproved(
  ): Promise<RentEntity[]> {
    return await this.rentService.findToApproved();
  }

  @Get('approved')
  @UseGuards(AuthGuard, RoleGuard)
  async approveRent(
  ): Promise<RentEntity[]> {
    return await this.rentService.findToApproved();
  }
}

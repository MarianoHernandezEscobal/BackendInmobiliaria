import { Controller, Post, Delete, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { PropertyEntity } from '@databaseProperties/property.entity';
import { AuthGuard } from '@src/user/guards/session.guard';
import { RequestWithUser } from '@src/user/interfaces/request.interface';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('add')
  @UseGuards(AuthGuard)
  async addFavorite(
    @Req() request: RequestWithUser,
    @Query('propertyId') propertyId: number,
  ): Promise<PropertyEntity[]> {
    return await this.favoritesService.addFavorite(request.user, +propertyId);
  }

  @Delete('delete')
  @UseGuards(AuthGuard)
  async removeFavorite(
    @Req() request: RequestWithUser,
    @Query('propertyId') propertyId: number,
  ): Promise<PropertyEntity[]> {
    return await this.favoritesService.removeFavorite(request.user, +propertyId);
  }

  @Get('get')
  @UseGuards(AuthGuard)
  async getFavorites(@Req() request: RequestWithUser): Promise<PropertyEntity[]> {
    return await this.favoritesService.getFavorites(request.user);
  }
}

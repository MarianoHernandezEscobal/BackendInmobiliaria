import { BadRequestException, HttpException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UsersDatabaseService } from "@databaseUser/user.database.service";
import { PropertiesDatabaseService } from "@databaseProperties/property.database.service";
import { PropertyEntity } from "@databaseProperties/property.entity";
import { FavoritesDatabaseService } from "@src/database/favorite/favorite.database.service";
import { UserResponseDto } from "@src/user/dto/user.response.dto";

@Injectable()
export class FavoritesService {
  constructor(
    private readonly usersDatabaseService: UsersDatabaseService,
    private readonly propertiesDatabaseService: PropertiesDatabaseService,
    private readonly favoritesDatabaseService: FavoritesDatabaseService,
  ) {}

  private handleException(e: any, message: string): void {
    if (e instanceof BadRequestException || e instanceof NotFoundException || e instanceof UnauthorizedException) {
      throw e;
    }
    console.error(e);
    throw new HttpException(message, 500);
  }

  async addFavorite(userRequest: UserResponseDto, propertyId: number): Promise<PropertyEntity[]> {
    try {
        const user = await this.usersDatabaseService.findOne(userRequest.id, ['favoriteProperties']);

        if (!user || user.email !== userRequest.email) {
          throw new NotFoundException('Usuario no encontrado');
        }

        const property = await this.propertiesDatabaseService.findOne(propertyId);

        if (!property) {
          throw new Error('Propiedad no encontrada');
        }

        if (user.favoriteProperties.find((fav) => fav.id === propertyId)) {
            return;
        }
        const userUpdated = await this.favoritesDatabaseService.addFavoriteProperty(user, property);
        return userUpdated?.favoriteProperties || [];
    } catch (e) {
        this.handleException(e, 'Error al añadir a favoritos');
    }
  }

  async removeFavorite(userRequest: UserResponseDto, propertyId: number): Promise<PropertyEntity[]> {
    const user = await this.usersDatabaseService.findOne(userRequest.id, ['favoriteProperties']);

    if (!user || user.email !== userRequest.email) {
      throw new Error('Usuario no encontrado');
    }

    await this.favoritesDatabaseService.removeFavorite(user, propertyId);
    return user.favoriteProperties || [];
  }

  async getFavorites(user: UserResponseDto): Promise<PropertyEntity[]> {
    const favoriteProperties = await this.favoritesDatabaseService.getFavorites(user.id);

    return favoriteProperties || [];
  }
}



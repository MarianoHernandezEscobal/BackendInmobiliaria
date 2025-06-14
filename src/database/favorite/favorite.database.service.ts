import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { PropertyEntity } from '../property/property.entity';

@Injectable()
export class FavoritesDatabaseService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async addFavoriteProperty(user: UserEntity, property: PropertyEntity): Promise<UserEntity | null> {
    user.favoriteProperties.push(property);
    const updatedUser = await this.userRepository.save(user);
    return updatedUser;
  }

  async removeFavorite(user: UserEntity, propertyId: number): Promise<void> {
    user.favoriteProperties = user.favoriteProperties.filter((fav) => fav.id !== propertyId);
    await this.userRepository.save(user);
  }

  async getFavorites(userId: number): Promise<PropertyEntity[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['favoriteProperties'],
    });

    return user?.favoriteProperties || [];
  }
}

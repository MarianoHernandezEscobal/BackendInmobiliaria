import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyEntity } from '@databaseProperties/property.entity';
import { UserEntity } from '@databaseUser/user.entity';
import { FavoritesController } from './favorite.controller';
import { DatabaseModule } from '@database/database.module';
import { FavoritesService } from './favorites.service';
import { UserModule } from '@user/user.module';


@Module({
  imports: [
    UserModule,
    DatabaseModule,
    TypeOrmModule.forFeature([UserEntity, PropertyEntity]),
  ],
  providers: [FavoritesService],
  controllers: [FavoritesController],
})
export class FavoritesModule {}
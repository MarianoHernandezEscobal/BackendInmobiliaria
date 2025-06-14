import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user/user.entity';
import { UsersDatabaseService } from './user/user.database.service';
import { PropertyEntity } from './property/property.entity';
import { PropertiesDatabaseService } from './property/property.database.service';
import { FavoritesDatabaseService } from './favorite/favorite.database.service';
import { RentEntity } from './rents/rents.entity';
import { RentsDatabaseService } from './rents/rent.database.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [UserEntity, PropertyEntity, RentEntity],
        synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
      }),
    }),
    TypeOrmModule.forFeature([UserEntity, PropertyEntity, RentEntity]),
  ],
  providers: [UsersDatabaseService, PropertiesDatabaseService, FavoritesDatabaseService, RentsDatabaseService],
  exports: [UsersDatabaseService, PropertiesDatabaseService, FavoritesDatabaseService, RentsDatabaseService],
})
export class DatabaseModule {}

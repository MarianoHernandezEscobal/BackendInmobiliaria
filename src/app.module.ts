import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { PropertyModule } from './property/property.module';
import { FavoritesModule } from './favorite/favorite.module';
import { RentModule } from './rent/rent.module';
import { MailModule } from './mail/mail.module';
import { RecaptchaClient } from './clients/recaptcha/recaptcha.client';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,     
      envFilePath: '.env',
    }),
    UserModule,
    PropertyModule,
    FavoritesModule,
    RentModule,
    MailModule,
  ],
})
export class AppModule {}
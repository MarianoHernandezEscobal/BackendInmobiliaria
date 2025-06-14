import { Module } from '@nestjs/common';
import { FacebookClient } from './facebook/facebook.client';
import { HttpModule } from '@nestjs/axios';
//import { WhatsAppClient } from './whatsapp/whatsapp.client';
import { RecaptchaClient } from './recaptcha/recaptcha.client';

@Module({
  imports: [ 
    HttpModule.register({
        timeout: 15000,
        maxRedirects: 5
    }),
],
  providers: [FacebookClient, RecaptchaClient], //WhatsAppClient, RecaptchaClient ],
  exports: [FacebookClient, RecaptchaClient] //WhatsAppClient, RecaptchaClient ],
})
export class ClientsModule {}

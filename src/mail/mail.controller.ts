import { Controller, Post, Body, UseGuards, Req } from "@nestjs/common";
import { SendMailDto } from "@property/dto/mail.dto";
import { MailService } from "./mail.service";
import { TokenGuard } from "@property/guards/token.guard";
import { RequestWithUser } from "@user/interfaces/request.interface";

  @Controller('mail')
  export class MailController {
    constructor(
      private readonly mailService: MailService
    ) {}

    @Post('consultation')
    @UseGuards(TokenGuard)
    async sendEmail(@Body() body: SendMailDto, @Req() request: RequestWithUser) {  
      await this.mailService.sendEmail(body, request.user);
      return { message: 'Correo enviado con éxito' };
    }
  }
  
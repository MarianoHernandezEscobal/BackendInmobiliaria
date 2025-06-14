import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendMailDto, SendNotificationDto } from '@src/property/dto/mail.dto';
import { UserResponseDto } from '@src/user/dto/user.response.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmail(body: SendMailDto, userRequest?: UserResponseDto): Promise<void> {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
          <p><strong>Nombre:</strong> ${userRequest?.firstName ?? 'No especificado'}</p>
          <p><strong>Telefono:</strong> ${userRequest?.phone ?? 'No especificado'}</p>
          <p><strong>Email:</strong> ${userRequest?.email ?? body.from}</p>
          <p><strong>Mensaje:</strong></p>
          <p style="font-size: 1.1em; margin: 10px 0; color: #555;">${body.content}</p>
          <p><strong>Propiedad:</strong> 
            <a href="${this.configService.get('FRONTEND_URL')}/properties/${body.id}" 
               style="color: #007BFF; text-decoration: none;">
              Ver Propiedad
            </a>
          </p>
        </div>
      `;
      const emailBody = {
        from: userRequest
          ? `"${userRequest.firstName} ${userRequest.lastName}" <${userRequest.email}>`
          : `"${body.name}" <${body.from}>`,
        replyTo: userRequest?.email ?? body.from,
        to: body.isRent ? this.configService.get('MAIL_RENT') : this.configService.get('MAIL_SALE'),
        subject: body.subject || 'Consulta sobre propiedad',
        text: body.content,
        html,
      };
      await this.mailerService.sendMail(emailBody);
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      throw new Error('No se pudo enviar el correo. Por favor, intente nuevamente más tarde.');
    }
  }
  

  async sendNotificationRent(body: SendNotificationDto, userRequest?: UserResponseDto): Promise<void> {
    try {
      const html = `<b>Nombre:</b> Inmobiliaria Costa Azul<br/> 
             <b>Email:</b>consultas@inmobiliariacostaazul.com<br/>
             <b>Mensaje:</b> ${body.content}`;
      const bodyRequest = {
        to: body.to,
        from: `Inmobiliaria Costa Azul <consultas@inmobiliariacostaazul.com>`,
        subject: body.subject,
        text: body.content,
        html,
        content: body.content,
      }
      await this.mailerService.sendMail(bodyRequest);
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      throw new Error('No se pudo enviar el correo');
    }
  }
}

import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable()
export class RecaptchaClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  validateToken(recaptcha: string): Observable<{success: boolean, error: boolean}> {
    const recaptchaToken = this.configService.get<string>('RECAPTCHA_SECRET_KEY');

    const body = {
        secret: recaptchaToken,
        response: recaptcha,
        };
    return this.httpService.post(`https://www.google.com/recaptcha/api/siteverify`,
      body,
    ).pipe(
      map((response) => response.data),
      catchError((error) => {
        console.error("Error validando reCAPTCHA:", error);
        return of({error: true, success: false});
      }),
    );
  }
}

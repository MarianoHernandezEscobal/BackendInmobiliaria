import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreatePost } from '@property/dto/facebook.create.request.dto';
import { catchError, map, Observable } from 'rxjs';
import { PostFacebook } from './dto/post.response.dto';

@Injectable()
export class FacebookClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  createPost(body: CreatePost): Observable<any> {
    const facebookUrl = this.configService.get<string>('FACEBOOK_URL');
    const pageId = this.configService.get<string>('FACEBOOK_PAGE_ID');
    const accessToken = this.configService.get<string>('FACEBOOK_USER_ACCESS_TOKEN');

    return this.httpService.post(
      `${facebookUrl}${pageId}/feed`,
      body,
      { params: { access_token: accessToken } },
    ).pipe(
      map((response) => response.data),
      catchError((error) => {
        throw new HttpException({ status: 400, error: error.message }, error.response.status);
      }),
    );
  }

  // Actualizar una publicación en Facebook
  updatePost(body: CreatePost, id: string): Observable<any> {
    const facebookUrl = this.configService.get<string>('FACEBOOK_URL');
    const accessToken = this.configService.get<string>('FACEBOOK_USER_ACCESS_TOKEN');

    return this.httpService.post(
      `${facebookUrl}${id}`,
      body,
      { params: { access_token: accessToken } },
    ).pipe(
      map((response) => response.data),
      catchError((error) => {
        throw new HttpException({ status: 400, error: error.message }, error.response.status);
      }),
    );
  }

  // Renovar Access Token de Usuario
  renewAccessTokenUser(): Observable<any> {
    const facebookUrl = this.configService.get<string>('FACEBOOK_URL');
    const appId = this.configService.get<string>('FACEBOOK_APP_ID');
    const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
    const userAccessToken = this.configService.get<string>('FACEBOOK_USER_ACCESS_TOKEN');

    return this.httpService.get(`${facebookUrl}oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: userAccessToken,
      },
    }).pipe(
      map((response) => response.data),
      catchError((error) => {
        throw new HttpException({ status: 400, error: error?.message }, error?.response?.status);
      }),
    );
  }

  // Obtener Access Token de Página de Facebook
  renewAccessTokenPage(): Observable<any> {
    const facebookUrl = this.configService.get<string>('FACEBOOK_URL');
    const userAccessToken = this.configService.get<string>('FACEBOOK_USER_ACCESS_TOKEN');

    return this.httpService.get(`${facebookUrl}me/accounts`, {
      params: { access_token: userAccessToken },
    }).pipe(
      map((response) => response.data),
      catchError((error) => {
        throw new HttpException({ status: 400, error: error.message }, error.response.status);
      }),
    );
  }

  // Obtener Publicaciones
  getPost(): Observable<PostFacebook[]> {
    const facebookUrl = this.configService.get<string>('FACEBOOK_URL');
    const pageId = this.configService.get<string>('FACEBOOK_PAGE_ID');
    const accessToken = this.configService.get<string>('FACEBOOK_USER_ACCESS_TOKEN');

    return this.httpService.get(`${facebookUrl}${pageId}/feed`, {
      params: { access_token: accessToken },
    }).pipe(
      map((response) => response?.data?.data),
      catchError((error) => {
        throw new HttpException({ status: 400, error: error.message }, error.response.status);
      }),
    );
  }
}

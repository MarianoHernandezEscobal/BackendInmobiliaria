import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreatePost } from '@property/dto/facebook.create.request.dto';
import { catchError, firstValueFrom, map, Observable } from 'rxjs';
import { PostFacebook } from './dto/post.response.dto';
import { File } from '@nest-lab/fastify-multer';
import { default as FormData } from "form-data";
import { RenewTokenPage } from './dto/page.renew.response.dto';
@Injectable()
export class FacebookClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) { }
  //crear publicacion
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

  async uploadPhotos(images: Array<File>): Promise<string[]> {
    const facebookUrl = this.configService.get<string>('FACEBOOK_URL');
    const pageId = this.configService.get<string>('FACEBOOK_PAGE_ID');
    const page_access_token = this.configService.get<string>('FACEBOOK_PAGE_ACCESS_TOKEN');
    if (!images?.length) return [];

    const uploadPromises = images.map(async (image) => {
      try {
        const formData = new FormData();
        formData.append('published', 'false');
        formData.append('access_token', page_access_token);
        formData.append('source', image.buffer, {
          filename: image.originalname,
          contentType: image.mimetype,
        });

        const headers = formData.getHeaders();

        const response = await firstValueFrom(
          this.httpService.post(
            `${facebookUrl}${pageId}/photos`,
            formData,
            { headers }
          )
        );

        return response.data.id;
      } catch (error) {
        console.log(error)
      }

    });

    return Promise.all(uploadPromises);
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
  renewAccessTokenPage(): Observable<RenewTokenPage> {
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

import { Injectable, BadRequestException, HttpException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PropertyDto } from './dto/property.dto';
import { PropertiesDatabaseService } from '@databaseProperties/property.database.service';
import { PropertyEntity } from '@databaseProperties/property.entity';
import { PropertyStatus } from '../enums/status.enum';
import { Home } from './dto/home.response.dto';
import { UserResponseDto } from '@user/dto/user.response.dto';
import { FacebookClient } from '@clients/facebook/facebook.client';
import { CreatePost } from './dto/facebook.create.request.dto';
import { firstValueFrom } from 'rxjs';
//import { WhatsAppClient } from '@src/clients/whatsapp/whatsapp.client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { UsersDatabaseService } from '@databaseUser/user.database.service';
import { MESSAGES } from '@src/constants/messages';
import { S3Service } from '@src/s3/s3.service';
import { File } from '@nest-lab/fastify-multer';
import { updateEnvFile } from '@src/utiles/editEnv';
import { restartApplication } from '@src/utiles/restartApp';
import { PropertyTypes } from '@src/enums/types.enum';

@Injectable()
export class PropertyService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly propertiesDatabaseService: PropertiesDatabaseService,
    private readonly userDatabaseService: UsersDatabaseService,
    private readonly facebookService: FacebookClient,
    //private readonly whatsApp: WhatsAppClient,
    private readonly configService: ConfigService,
  ) {}

  private handleException(e: any, message: string): void {
    if (e instanceof BadRequestException || e instanceof NotFoundException || e instanceof UnauthorizedException) {
      throw e;
    }
    console.error(e);
    throw new HttpException(message, 500);
  }

  private async validatePropertyTitle(title: string): Promise<void> {
    const existingProperty = await this.propertiesDatabaseService.findTitle(title);
    if (existingProperty) {
      throw new BadRequestException('Ya existe una propiedad con ese título');
    }
  }

  async create(create: PropertyDto, userRequest: UserResponseDto, images: Array<File>): Promise<PropertyDto> {
    try {
      await this.validatePropertyTitle(create.title);
      const user = await this.userDatabaseService.findOne(userRequest.id);
     
      const entity = PropertyEntity.fromDto(create, user);
      entity.imageSrc = await this.uploadImagesToS3(images);
      entity.approved = user.admin;
      const savedProperty = await this.propertiesDatabaseService.create(entity);

      if (savedProperty.approved) {
        // await firstValueFrom(this.facebookService.createPost(new CreatePost(savedProperty)));
      }

      return new PropertyDto(savedProperty);
    } catch (e) {
      this.handleException(e, 'Error al crear la propiedad');
    }
  }

  async getTermsAndConditions(): Promise<string> {
    try {
      return this.configService.get<string>('TERMS_AND_CONDITIONS');
    } catch (e) {
      this.handleException(e, 'Error al obtener los términos y condiciones');
    }
  }

  async findOne(id: string): Promise<PropertyDto> {
    try {
      const idNumber = parseInt(id);
      const savedProperty = await this.propertiesDatabaseService.findOne(idNumber);
      if (!savedProperty) {
        throw new NotFoundException('Propiedad no encontrada');
      }
      return new PropertyDto(savedProperty);
    } catch (e) {
      this.handleException(e, 'Error al encontrar la propiedad');
    }
  }

  async home(userRequest?: UserResponseDto): Promise<Home> {
    try {
      // Ejecutar consultas en paralelo
      const [properties, land, pinned, user] = await Promise.all([
        this.propertiesDatabaseService.findHome(PropertyStatus.ForSale),
        this.propertiesDatabaseService.findHome(null, PropertyTypes.LAND),
        this.propertiesDatabaseService.findPinned(),
        userRequest ? this.userDatabaseService.findOneEmail(userRequest.email, ['favoriteProperties', 'propertiesCreated']) : null,
      ]);

      if (userRequest && !user) {
        throw new BadRequestException(MESSAGES.USER_NOT_FOUND);
      }

      if (!properties.length && !land.length && !pinned.length) {
        throw new NotFoundException('No se encontraron propiedades');
      }

      return {
        properties: properties.map(property => new PropertyDto(property)),
        land: land.map(property => new PropertyDto(property)),
        pinned: pinned.map(property => new PropertyDto(property)),
        favourites: user ? user.favoriteProperties.map(property => new PropertyDto(property)) : [],
        created: user ? user.propertiesCreated.map(property => new PropertyDto(property)) : [],
      };
    } catch (e) {
      this.handleException(e, 'Error al obtener el home');
    }
  }

  async update(
    updateDto: PropertyDto,
    user: UserResponseDto,
    deleteImages: string[], // Ahora acepta URLs o claves S3 directamente
    newImages: Array<File>
  ): Promise<PropertyDto> {
    try {
      // Validar propiedad y permisos
      const property = await this.propertiesDatabaseService.findOne(updateDto.id, [
        'usersWithFavourite',
        'createdBy',
        'rents',
      ]);
  
      if (!property) {
        throw new NotFoundException('Propiedad no encontrada');
      }
  
      if (!user.admin && updateDto?.approved !== undefined) {
        throw new UnauthorizedException('No tienes permisos para aprobar la propiedad');
      }
  
      if (!user.admin) {
        delete updateDto.approved;
      }
  
      // Eliminar y subir imágenes
      const [deletedKeys, newImageUrls] = await Promise.allSettled([
        this.deleteImagesFromS3(deleteImages),
        this.uploadImagesToS3(newImages),
      ]);
  
      // Filtrar imágenes eliminadas y agregar nuevas
      updateDto.imageSrc = [
        ...property.imageSrc.filter((img) => !(deletedKeys.status === 'fulfilled' && deletedKeys.value.includes(img))),
        ...(newImageUrls.status === 'fulfilled' ? newImageUrls.value : []),
      ];
  
      const oldProperty = new PropertyDto(property);
  
      // Actualizar la propiedad
      const updatedProperty = await this.propertiesDatabaseService.update(
        property,
        PropertyEntity.fromDto(updateDto, property.createdBy),
      );
  
      // if (updatedProperty.approved) {
      //   await Promise.all([
      //     this.updatePostFacebook(updatedProperty, oldProperty),
      //     this.sendMessages(updatedProperty),
      //   ]);
      // }
  
      return new PropertyDto(updatedProperty);
    } catch (error) {
      this.handleException(error, 'Error al actualizar la propiedad');
      throw error;
    }
  }
  
  
  private async deleteImagesFromS3(imageKeys: string[]): Promise<string[]> {
    if (!imageKeys.length) return [];
    return Promise.all(
      imageKeys.map(async (key) => {
        await this.s3Service.deleteFile(key);
        return key;
      }),
    );
  }
  
  private async uploadImagesToS3(images: Array<File>): Promise<string[]> {
    if (!images.length) return [];
    return Promise.all(
      images.map((file) => this.s3Service.uploadFile(file.buffer, file.originalname)),
    );
  }
  
  private validatePropertyStatus(status: string): PropertyStatus {
    const propertyType = Object.values(PropertyStatus).find(type => type === status);
    if (!propertyType) {
      throw new BadRequestException(`Invalid property type: ${status}`);
    }
    return propertyType;
  }

  async filterStatus(status: string, page: number): Promise<PropertyDto[]> {
    try {
      const propertyType = this.validatePropertyStatus(status);
      const properties = await this.propertiesDatabaseService.filterByStatus(propertyType, page);

      if (!properties.length) {
        throw new NotFoundException('Propiedades no encontradas');
      }

      return properties.map(property => new PropertyDto(property));
    } catch (e) {
      this.handleException(e, 'Error al filtrar las propiedades');
    }
  }

  async findToApprove(): Promise<PropertyDto[]> {
    try {
      const properties = await this.propertiesDatabaseService.findToApprove();
      if (!properties.length) {
        throw new NotFoundException('Propiedades no encontradas');
      }
      return properties.map(property => new PropertyDto(property));
    } catch (e) {
      this.handleException(e, 'Error al filtrar las propiedades');
    }
  }

  async findAll(userId?: string): Promise<PropertyDto[]> {
    try {
      if (userId) {
        const user = await this.userDatabaseService.findOne(+userId, ['favoriteProperties']);
        if (!user) {
          throw new NotFoundException('Usuario no encontrado');
        }
        
      }
      const properties = await this.propertiesDatabaseService.findAll();
      if (!properties.length) {
        throw new NotFoundException('Propiedades no encontradas');
      }
      return properties.map((property: PropertyEntity) => new PropertyDto(property));
    } catch (e) {
      this.handleException(e, 'Error al obtener las propiedades');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const idNumber = parseInt(id);
      const property = await this.propertiesDatabaseService.findOne(idNumber);
      if (!property) {
        throw new NotFoundException('Propiedad no encontrada');
      }
      await this.propertiesDatabaseService.remove(idNumber);
    } catch (e) {
      this.handleException(e, 'Error al eliminar la propiedad');
    }
  }

  async getCreatedProperties(user: UserResponseDto): Promise<PropertyDto[]> {
    try {
      const properties = await this.propertiesDatabaseService.findCreatedProperties(user.id);
      if (!properties.length) {
        throw new NotFoundException('Propiedades no encontradas');
      }
      return properties.map(property => new PropertyDto(property));
    } catch (e) {
      this.handleException(e, 'Error al obtener las propiedades');
    }
  }

  private async sendMessages(property: PropertyEntity): Promise<void> {
    const URL_INMO = this.configService.get<string>('URL_INMO');
    const propertie = await this.propertiesDatabaseService.findOne(property.id, ['usersWithFavourite']);
    const users = propertie.usersWithFavourite;
    users.forEach(user => {
      // this.whatsApp.sendMessage(user.phone, `Hola ${user.firstName}, se actualizo tu propiedad favorita ${property.title}\n${URL_INMO}${property.id}`);
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async renewFacebookTokens() {
    try {
      console.log('[Facebook Token Refresh] Iniciando...');

      const userTokenResponse = await firstValueFrom(this.facebookService.renewAccessTokenUser());
      const newUserToken = userTokenResponse.access_token;

      const pageTokensResponse = await firstValueFrom(this.facebookService.renewAccessTokenPage());
      const pageAccessToken = pageTokensResponse.data[0]?.access_token;

      if (newUserToken && pageAccessToken) {
        console.log('[Facebook] Nuevos Access Tokens obtenidos.');
        
        await updateEnvFile({
          FACEBOOK_USER_ACCESS_TOKEN: newUserToken,
          FACEBOOK_PAGE_ACCESS_TOKEN: pageAccessToken,
        });

        await restartApplication();
      }
    } catch (error) {
      console.error('[Facebook] Error al renovar Access Token:', error);
    }
  }

  private async updatePostFacebook(updatedProperty: PropertyEntity, oldProperty: PropertyDto): Promise<void> {
    try {
      const post = await firstValueFrom(this.facebookService.getPost());
      if (!post) {
        return;
      }
      const filterPost = post.find(p => p.message === `${oldProperty.title}\n${oldProperty.shortDescription}`);
      if (filterPost) {
        await firstValueFrom(this.facebookService.updatePost(new CreatePost(updatedProperty), filterPost.id));
        return;
      }
      await firstValueFrom(this.facebookService.createPost(new CreatePost(updatedProperty)));

    } catch (error) {
      console.error('Error al actualizar el post de Facebook:', error);
    }
  }

}

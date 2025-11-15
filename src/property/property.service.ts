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
import { PropertyTypes } from '@src/enums/types.enum';
import { UpdatePropertyDto } from './dto/update-property.dto';

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

  async create(create: PropertyDto, userRequest: UserResponseDto, images: Array<File>, facebook: boolean): Promise<PropertyDto> {
    try {
      await this.validatePropertyTitle(create.title);
      const user = await this.userDatabaseService.findOne(userRequest.id);
     
      const entity = PropertyEntity.fromDto(create, user);
      entity.imageSrc = await this.uploadImagesToS3(images);
      entity.approved = user.admin;
      const savedProperty = await this.propertiesDatabaseService.create(entity);

      if (savedProperty.approved && facebook) {
        const photoIds = await this.facebookService.uploadPhotos(images);
        await firstValueFrom(this.facebookService.createPost(new CreatePost(savedProperty, photoIds)));
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

  printallenvs(){
    const allEnv = this.configService['internalConfig']?.getProperties?.() || process.env;
console.log(allEnv);
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
  updateDto: UpdatePropertyDto,
  userRequest: UserResponseDto,
): Promise<PropertyDto> {
  try {
    const property = await this.propertiesDatabaseService.findOne(updateDto.id);
    const user = await this.userDatabaseService.findOne(userRequest.id);

    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    if (!user.admin && updateDto?.approved !== undefined) {
      throw new UnauthorizedException('No tienes permisos para aprobar la propiedad');
    }

    if (!user.admin) {
      delete updateDto.approved;
    }

    const finalUrls: string[] = [];
    const imagesToDelete: string[] = [];

    for (const img of updateDto.imageSrc) {
      if (img.deleted) {
        imagesToDelete.push(img.url);
        continue;
      }

      if (img.isNew && img.file) {
        const uploadedUrl = await this.s3Service.uploadFile(img.file.buffer, img.file.originalname)
        finalUrls.push(uploadedUrl);
        continue;
      }

      if (!img.isNew) {
        finalUrls.push(img.url);
      }
    }

    if (imagesToDelete.length > 0) {
      await this.deleteImagesFromS3(imagesToDelete);
    }
    const propertieToUpdate = { ...updateDto, imageSrc: finalUrls }
    const oldProperty = new PropertyDto(property);
    const updatedProperty = await this.propertiesDatabaseService.update(
      property,
      PropertyEntity.fromDto(propertieToUpdate, user),
    );

    if (updatedProperty.approved) {
      await this.updatePostFacebook(updatedProperty, oldProperty);
    }

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
      await this.deleteImagesFromS3(property.imageSrc);
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

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_NOON)
  async renewFacebookTokens() {
    try {
      console.log('[Facebook Token Refresh] Iniciando...');

      const userTokenResponse = await firstValueFrom(this.facebookService.renewAccessTokenUser());
      const newUserToken = userTokenResponse.access_token;

      const pageTokensResponse = await firstValueFrom(this.facebookService.renewAccessTokenPage());
      const pageId = this.configService.get<string>('FACEBOOK_PAGE_ID');

      let pageAccessToken; 
      for (const response of pageTokensResponse.data) {
        if(response.id == pageId){
          pageAccessToken = response.access_token
        }
      }

      if (newUserToken && pageAccessToken) {
        console.log('[Facebook] Nuevos Access Tokens obtenidos.');
        
        await updateEnvFile({
          FACEBOOK_USER_ACCESS_TOKEN: newUserToken,
          FACEBOOK_PAGE_ACCESS_TOKEN: pageAccessToken,
        });

        process.env.FACEBOOK_USER_ACCESS_TOKEN = newUserToken
        process.env.FACEBOOK_PAGE_ACCESS_TOKEN = pageAccessToken

        console.log(process.env.FACEBOOK_USER_ACCESS_TOKEN)
        console.log(process.env.FACEBOOK_PAGE_ACCESS_TOKEN)

       // await restartApplication();
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
      const filterPost = post.find(p => p?.message?.includes(`${oldProperty.title}\n\n${oldProperty.shortDescription}`));
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

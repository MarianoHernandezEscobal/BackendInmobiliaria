import { 
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  NotFoundException,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UploadedFiles,
  UseGuards, 
  UseInterceptors} from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyDto } from './dto/property.dto';
import { Home } from './dto/home.response.dto';
import { AuthGuard } from '@user/guards/session.guard';
import { RequestWithUser } from '@user/interfaces/request.interface';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { TokenGuard } from './guards/token.guard';
import { FilesInterceptor, File } from '@nest-lab/fastify-multer';
import { RoleGuard } from '@src/user/guards/admin.guard';



@ApiTags('Properties')
@Controller('properties')
export class PropertyController {
  constructor(
    private readonly propertyService: PropertyService,
  ) {}

  @Post('create')
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor("files", 25))
  async create(
    @Body('property') property: string,
    @UploadedFiles() files: Array<File>,
    @Req() request: RequestWithUser,
  ): Promise<PropertyDto> {
    const propertyDto: PropertyDto = JSON.parse(property);
    return await this.propertyService.create(propertyDto, request.user, files);
  }

  @Get('terms')
  @ApiOperation({ summary: 'Obtener los términos y condiciones' })
  @ApiResponse({ status: 200, description: 'Términos y condiciones obtenidos correctamente', type: String })
  @ApiResponse({ status: 404, description: 'No se encontraron términos y condiciones', type: NotFoundException })
  @ApiResponse({ status: 500, description: 'Error interno del servidor', type: HttpException })
  async termsAndConditions(): Promise<string> {
    return await this.propertyService.getTermsAndConditions();
  }

  @Delete('delete')
  @UseGuards(AuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Eliminar una propiedad existente' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'id', type: 'string', description: 'ID de la propiedad a eliminar' })
  @ApiResponse({ status: 200, description: 'Propiedad eliminada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado (Token faltante o inválido)', type: UnauthorizedException })
  @ApiResponse({ status: 404, description: 'Propiedad no encontrada', type: NotFoundException })
  @ApiResponse({ status: 500, description: 'Error interno del servidor', type: HttpException })
  async delete(
    @Query('id') id: string,
  ): Promise<void> {
    await this.propertyService.remove(id);
  }


  @Put('update')
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor("files", 25))
  async update(
    @Body('property') property: string,
    @Body('deletedImages') deletedImages: string,
    @UploadedFiles() newImages: Array<File>,
    @Req() request: RequestWithUser
  ): Promise<PropertyDto> {
    try{
      const propertyDto: PropertyDto = JSON.parse(property);
      const imagesDeleted: string[] = JSON.parse(deletedImages);
      return await this.propertyService.update(propertyDto, request.user, imagesDeleted, newImages);
    }catch(error){
      console.log(error);
    }

  }

    @Get('findOne')
    @ApiOperation({ summary: 'Encuentra una propiedad por ID' })
    @ApiQuery({ name: 'id', type: 'string', description: 'ID de la propiedad a buscar' })
    @ApiResponse({ status: 200, description: 'Propiedad encontrada', type: PropertyDto })
    @ApiResponse({ status: 404, description: 'Propiedad no encontrada', type: NotFoundException })
    @ApiResponse({ status: 500, description: 'Error interno del servidor', type: HttpException })
    async findOne(
      @Query('id') id: string
    ): Promise<PropertyDto> {
      return await this.propertyService.findOne(id);
    }
  

  @Get('home')
  @UseGuards(TokenGuard)
  @ApiOperation({ summary: 'Obtener las propiedades para el home' })
  @ApiResponse({ status: 200, description: 'Propiedades obtenidas correctamente', type: Home })
  @ApiResponse({ status: 404, description: 'Propiedades no encontradas', type: NotFoundException })
  @ApiResponse({ status: 500, description: 'Error interno del servidor', type: HttpException })
  async home(@Req() request: RequestWithUser,): Promise<Home> {
    return await this.propertyService.home(request.user);
  }

  @Get('filterStatus')
  @ApiOperation({ summary: 'Filtrar propiedades por estado' })
  @ApiQuery({ name: 'status', type: 'string', description: 'El estado de la propiedad (ForRent, ForSale, etc.)' })
  @ApiQuery({ name: 'page', type: 'number', description: 'Número de página para la paginación' })
  @ApiResponse({ status: 200, description: 'Propiedades filtradas correctamente', type: [PropertyDto] })
  @ApiResponse({ status: 400, description: 'Tipo de propiedad inválido', type: BadRequestException })
  @ApiResponse({ status: 404, description: 'Propiedades no encontradas', type: NotFoundException })
  @ApiResponse({ status: 500, description: 'Error interno del servidor', type: HttpException })
  async filterStatus(
    @Query('status') status: string,
    @Query('page') page: number
  ): Promise<PropertyDto[]> {
    return await this.propertyService.filterStatus(status, page);
  }

  @Get('findToApproved')
  @ApiOperation({ summary: 'Obtener propiedades pendientes de aprobación' })
  @ApiResponse({ status: 200, description: 'Propiedades encontradas para aprobar', type: [PropertyDto] })
  @ApiResponse({ status: 404, description: 'No se encontraron propiedades para aprobar', type: NotFoundException })
  @ApiResponse({ status: 500, description: 'Error interno del servidor',  type: HttpException })
  async filterToApproved(
  ): Promise<PropertyDto[]> {
    return await this.propertyService.findToApprove();
  }

  @Get('findAll')
  @ApiOperation({ summary: 'Obtener todas las propiedades' })
  @ApiResponse({ status: 200, description: 'Propiedades encontradas', type: [PropertyDto] })
  @ApiResponse({ status: 404, description: 'No se encontraron propiedades', type: NotFoundException })
  @ApiResponse({ status: 500, description: 'Error interno del servidor', type: HttpException })
  async findAll(): Promise<PropertyDto[]> {
    return await this.propertyService.findAll();
  }

  @Get('createdProperties')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener propiedades creadas por el usuario' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Propiedades encontradas', type: [PropertyDto] })
  @ApiResponse({ status: 404, description: 'No se encontraron propiedades', type: NotFoundException })
  @ApiResponse({ status: 500, description: 'Error interno del servidor', type: HttpException })
  async createdProperties(
    @Req() request: RequestWithUser
  ): Promise<PropertyDto[]> {
    return await this.propertyService.getCreatedProperties(request.user);
  }

  @Get('testTokens')
  async testTokens() {
    await this.propertyService.renewFacebookTokens();
  }
}

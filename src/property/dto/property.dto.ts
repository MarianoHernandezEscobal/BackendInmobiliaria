import { PropertyTypes } from "@enums/types.enum";
import { GeoCoordinatesDto } from "@property/dto/geoCoordinates.dto";
import { PropertyEntity } from "@databaseProperties/property.entity";
import { PropertyStatus } from "@enums/status.enum";
import { IsArray, IsEnum, IsNumber, IsString, IsBoolean, IsDate, IsOptional, IsObject } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "@user/dto/user.dto";
import { RentDTO } from "@rent/dto/rent.dto";
import { UserResponseDto } from "@user/dto/user.response.dto";

export class PropertyDto {

    @ApiProperty({ description: 'ID de la propiedad' })
    id: number;

    @ApiProperty({ description: 'Título de la propiedad' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'Descripción de la propiedad' })
    @IsString()
    shortDescription: string;

    @ApiProperty({ description: 'Descripción de la larga de la propiedad' })
    @IsString()
    longDescription: string;

    @ApiProperty({ description: 'Precio de la propiedad' })
    @IsNumber()
    price: number;
    
    @ApiProperty({ description: 'Tipo de propiedad', enum: PropertyTypes })
    @IsEnum(PropertyTypes, { message: 'Invalid property type' })
    type: PropertyTypes;

    @ApiProperty({ description: 'Estado(s) de la propiedad', enum: PropertyStatus, isArray: true })
    @IsArray()
    @IsEnum(PropertyStatus, { each: true, message: 'Each value must be a valid PropertyStatus' })
    status: PropertyStatus[];

    @ApiProperty({ description: 'Metros cuadrados de la propiedad' })
    @IsNumber()
    lotSize: number;

    @ApiProperty({ description: 'Metros cuadrados de construcción de la propiedad' })
    @IsNumber()
    area: number;

    @ApiProperty({ description: 'Número de habitaciones' })
    @IsNumber()
    rooms: number;

    @ApiProperty({ description: 'Número de baños' })
    @IsNumber()
    bathrooms: number;

    @ApiProperty({ description: 'Dirección de la propiedad' })
    @IsString()
    address: string;

    @ApiProperty({ description: 'Coordenadas geográficas', type: () => GeoCoordinatesDto })
    @IsOptional()
    geoCoordinates: GeoCoordinatesDto;

    @ApiProperty({ description: 'Barrio de la propiedad' })
    @IsString()
    neighborhood: string;

    @ApiProperty({ description: 'Año de construcción de la propiedad' })
    @IsNumber()
    yearBuilt: number;

    @ApiProperty({ description: 'Tiene garage' })
    @IsBoolean()
    garage: boolean;

    @ApiProperty({ description: 'Tiene piscina' })
    @IsBoolean()
    pool: boolean;

    @ApiProperty({ description: 'Imágenes de la propiedad', isArray: true })
    @IsArray()
    @IsString({ each: true })
    imageSrc: string[];

    @ApiProperty({ description: 'Contribución' })
    @IsString()
    contribution: number;

    @ApiProperty({ description: 'Caracteristicas' })
    @IsString()
    features: string;

    @ApiProperty({ description: 'Propiedad pineada', default: false })
    @IsOptional()
    @IsBoolean()
    pinned: boolean;

    @ApiProperty({ description: 'Propiedad aprobada', default: false })
    @IsOptional()
    @IsBoolean()
    approved: boolean;

    @ApiProperty({ description: 'Fecha de creación de la propiedad' })
    @IsDate()
    @IsOptional()
    createdAt: Date;

    @ApiProperty({ description: 'Fecha de creación de la propiedad' })
    @IsOptional()
    @IsObject()
    usersWithFavourite: User[];

    @ApiProperty({ description: 'Fecha de creación de la propiedad' })
    @IsOptional()
    @IsObject()
    createdBy: UserResponseDto;

    @ApiProperty({ description: 'Fecha de creación de la propiedad' })
    @IsOptional()
    @IsObject()
    rents: RentDTO[];

    constructor(property: PropertyEntity) {
        this.id = property.id;
        this.title = property.title;
        this.shortDescription = property.description;
        this.price = property.price;
        this.type = property.type;
        this.status = property?.status || [];
        this.lotSize = property.lotSize;
        this.area = property.area;
        this.pool = property.pool;
        this.rooms = property.rooms;
        this.bathrooms = property.bathrooms;
        this.address = property.address;
        this.geoCoordinates = property?.geoCoordinates || null;
        this.neighborhood = property.neighborhood;
        this.yearBuilt = property.yearBuilt;
        this.imageSrc = property?.imageSrc || [];
        this.contribution = property.contribution;
        this.longDescription = property.longDescription;
        this.garage = property.garage;
        this.pinned = property.pinned;
        this.approved = property.approved;
        this.features = property?.features || "";
        this.createdAt = property.createdAt;
        this.createdBy = property?.createdBy ? new UserResponseDto(property?.createdBy) : null;
        this.rents = property?.rents ? property.rents.map( rent => RentDTO.fromEntity(rent)): [];
    }
}

import { GeoCoordinatesDto } from "@property/dto/geoCoordinates.dto";
import { PropertyStatus } from "@enums/status.enum";
import { User } from "@user/dto/user.dto";
import { RentDTO } from "@rent/dto/rent.dto";
import { UserResponseDto } from "@user/dto/user.response.dto";
import { File } from '@nest-lab/fastify-multer';
export class UpdatePropertyDto {

    id: number;
    title: string;
    shortDescription: string;
    longDescription: string;
    price: number;
    type: string;
    status: PropertyStatus[];
    lotSize: number;
    area: number;
    rooms: number;
    bathrooms: number;
    address: string;
    geoCoordinates: GeoCoordinatesDto;
    neighborhood: string;
    yearBuilt: number;
    garage: boolean;
    pool: boolean;
    imageSrc: ImageList;
    contribution: number;
    features: string;
    pinned: boolean;
    approved: boolean;
    createdAt: Date;
    usersWithFavourite: User[];
    createdBy: UserResponseDto;
    rents: RentDTO[];
}

export interface ImageItem {
  url: string
  file?: File
  isNew: boolean
  deleted: boolean
}

export type ImageList = ImageItem[]

import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class GeoCoordinatesDto {
    @ApiProperty({ description: 'Latitud de la propiedad', example: -34.603722 })
    @IsString()
    lat: number;

    @ApiProperty({ description: 'Longitud de la propiedad', example: -58.381592 })
    @IsString()
    lng: number;
}
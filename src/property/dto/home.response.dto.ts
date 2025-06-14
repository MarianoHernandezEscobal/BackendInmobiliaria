import { ApiProperty } from "@nestjs/swagger";
import { PropertyDto } from "./property.dto";

export class Home{
    @ApiProperty({ type: [PropertyDto], description: 'Propiedades en alquiler' })
    properties: PropertyDto[];
  
    @ApiProperty({ type: [PropertyDto], description: 'Propiedades en venta' })
    land: PropertyDto[];
  
    @ApiProperty({ type: [PropertyDto], description: 'Propiedades pineadas' })
    pinned: PropertyDto[];

    @ApiProperty({ type: [PropertyDto], description: 'Propiedades favoritas' })
    favourites?: PropertyDto[];

    @ApiProperty({ type: [PropertyDto], description: 'Propiedades creadas' })
    created?: PropertyDto[];
}
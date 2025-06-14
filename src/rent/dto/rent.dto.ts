import { IsDate } from 'class-validator';
import { Transform } from 'class-transformer';
import { PropertyEntity } from '@database/property/property.entity';
import { RentEntity } from '@src/database/rents/rents.entity';


export class RentDTO {
    @Transform(( value ) => RentDTO.parseDate(value.value, 15))
    @IsDate()
    checkIn: Date;
    
    @Transform((value ) => RentDTO.parseDate(value.value, 10))
    @IsDate()
    checkOut: Date;

    email?: string;
    user?: number;
    propertyId: number;

    // constructor(rent: RentEntity) {
    //     this.dateStart = rent.dateStart;
    //     this.dateEnd = rent.dateEnd;
    //     this.email = rent.email;
    //     this.user = rent.user?.id;
    //     this.property = rent.property;
    // }
    static fromEntity(rent: RentEntity): RentDTO {
        const dto = new RentDTO();
        dto.checkIn = rent.checkIn;
        dto.checkOut = rent.checkOut;
        dto.email = rent.email;
        dto.user = rent.user?.id;
        dto.propertyId = rent.property.id;
        return dto;
    }
    private static parseDate(value: string, hours: number): Date {
      const date = new Date(value);
      date.setHours(hours, 0, 0, 0);
      return date;
    }
}




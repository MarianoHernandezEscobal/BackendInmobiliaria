import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { RentDTO } from '@src/rent/dto/rent.dto';
import { UserEntity } from '../user/user.entity';
import { PropertyEntity } from '../property/property.entity';
import { IsOptional } from 'class-validator';

@Entity()
export class RentEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'datetime' })
    checkIn: Date;

    @Column({ type: 'datetime' })
    checkOut: Date;

    @Column()
    price: number;

    @CreateDateColumn()
    createdAt: Date;

    @Column()
    approved: boolean;

    @Column()
    email: string;

    @ManyToOne('UserEntity', 'rents')
    @IsOptional()
    user?: UserEntity;
  
    @ManyToOne('PropertyEntity', 'rents')
    property: PropertyEntity;


    static fromDto(rent: RentDTO, email:string, property: PropertyEntity, userAdmin: boolean, user?: UserEntity, ): RentEntity {
        const entity = new RentEntity();
        entity.checkIn = rent.checkIn;
        entity.checkOut = rent.checkOut;
        entity.price = property.price * (entity.checkOut.getDate() - entity.checkIn.getDate());
        entity.approved = userAdmin;
        entity.user = user;
        entity.email = email;
        entity.property = property;
        return entity;
    }
}
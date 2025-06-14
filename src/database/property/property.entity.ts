import { BadRequestException, forwardRef } from '@nestjs/common';
import { GeoCoordinatesDto } from '@src/property/dto/geoCoordinates.dto';
import { PropertyDto } from '@src/property/dto/property.dto';
import { PropertyStatus } from '@src/enums/status.enum';
import { PropertyTypes } from '@src/enums/types.enum';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToMany, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { RentEntity } from '../rents/rents.entity';

@Entity()
export class PropertyEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    title: string;
    
    @Column()
    description: string;
    
    @Column({ type: 'longtext' })
    longDescription: string;

    @Column()
    price: number;

    @Column({
        type: 'enum',
        enum: PropertyTypes,
      })
    type: PropertyTypes;
    
    @Column({
        type: 'simple-array',
    })
    status: PropertyStatus[];

    @Column()
    lotSize: number;

    @Column()
    area: number;

    @Column()
    rooms: number;

    @Column()
    bathrooms: number;

    @Column()
    address: string;

    @Column('json', { nullable: true })
    geoCoordinates: GeoCoordinatesDto;

    @Column()
    neighborhood: string;

    @Column()
    yearBuilt: number;

    @Column()
    garage: boolean;

    @Column()
    pool: boolean;

    @Column({ type: 'simple-array' })
    imageSrc: string[];

    @Column()
    contribution: number;

    @Column()
    features: string;

    @Column({ default: false })
    pinned: boolean;

    @Column({ default: false })
    approved: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToMany('UserEntity', 'favoriteProperties')
    usersWithFavourite: UserEntity[];
    
    @ManyToOne('UserEntity', 'propertiesCreated')
    @JoinColumn({ name: 'createdBy' })
    createdBy: UserEntity;

    @OneToMany('RentEntity', 'property')
    rents: RentEntity[];

    static fromDto(property: PropertyDto, user: UserEntity): PropertyEntity {
        const entity = new PropertyEntity();
        entity.title = property.title;
        entity.description = property.shortDescription;
        entity.price = property.price;
        const propertyType = Object.values(PropertyTypes).find((type) => type === property.type);
        if (!propertyType) {
          throw new BadRequestException(`Invalid property type: ${property.type}`);
        }
        entity.type = propertyType;

        if (property?.status) {
            property?.status?.forEach((status) => {
                const propertyStatus = Object.values(PropertyStatus).find((type) => type === status);
                if (!propertyStatus) {
                    throw new BadRequestException(`Invalid property status: ${status}`);
                }
            });
        }

        entity.status = property.status;
        entity.lotSize = property.lotSize;
        entity.area = property.area;
        entity.rooms = property.rooms;
        entity.bathrooms = property.bathrooms;
        entity.address = property.address;
        entity.geoCoordinates = property.geoCoordinates;
        entity.neighborhood = property.neighborhood;
        entity.yearBuilt = property.yearBuilt;
        entity.imageSrc = property.imageSrc;
        entity.longDescription = property.longDescription;
        entity.garage = property.garage;
        entity.contribution = property.contribution;
        entity.pinned = user.admin ? property.pinned : false;
        entity.pool = property.pool;
        entity.approved = user.admin;
        entity.createdBy = user;
        entity.features = property.features;
        return entity;
    }

    static toDto(property: PropertyEntity): PropertyDto {
        return new PropertyDto(property);
    }
}


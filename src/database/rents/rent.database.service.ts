import { Injectable } from '@nestjs/common';
import { RentEntity } from './rents.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { PropertyEntity } from '../property/property.entity';

@Injectable()
export class RentsDatabaseService {
    constructor(
        @InjectRepository(RentEntity,)
        private rentRepository: Repository<RentEntity>,
      ) {}

    create(rent: RentEntity): Promise<RentEntity | null> {
        return this.rentRepository.save(rent);
    }

    findByUser(userId: number): Promise<RentEntity[]> {
        return this.rentRepository.find({
            where: { user: { id: userId } },
            relations: ['property'],
        });
    }

    findRentsInDateRange(checkIn: Date, checkOut: Date, property: PropertyEntity): Promise<RentEntity[]> {
        return this.rentRepository.find({
            where: {
                property: { id: property.id },
                checkIn: LessThanOrEqual(checkOut),
                checkOut: MoreThanOrEqual(checkIn),
            },
        });
    }

    findPropertyRents(property: PropertyEntity): Promise<RentEntity[]> {
        return this.rentRepository.find({
            where: { property: { id: property.id } },
        });
    }

    async findToApprove(): Promise<RentEntity[]> {
        return this.rentRepository.find({ where: { approved: false } });
    }

    async update(rent: RentEntity): Promise<RentEntity | null> {
        const updatedRent = await this.rentRepository.save(rent);
        return updatedRent;
    }

    async findOne(id: number): Promise<RentEntity | null> {
        return this.rentRepository.findOne({ where: { id } });
    }

    async remove(id: number): Promise<void> {
        await this.rentRepository.delete(id);
    }
}
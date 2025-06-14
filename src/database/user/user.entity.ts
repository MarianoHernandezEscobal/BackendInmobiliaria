import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { PropertyEntity } from '../property/property.entity';
import { RentEntity } from '../rents/rents.entity';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column({ unique: true })
  email: string;

  @Column({
    nullable: false,
  })
  phone: string;

  @Column()
  password: string;

  @Column()
  lastName: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  admin: boolean;

  @ManyToMany('PropertyEntity', 'usersWithFavourite')
  @JoinTable({
    name: 'favorites',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'property_id',
      referencedColumnName: 'id',
    },
  })
  favoriteProperties: PropertyEntity[];

  @OneToMany('PropertyEntity', 'createdBy')
  propertiesCreated: PropertyEntity[];

  @OneToMany('RentEntity', 'user')
  rents: RentEntity[];
}

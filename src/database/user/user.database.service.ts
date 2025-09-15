import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { User } from '../../user/dto/user.dto';
import { PropertyEntity } from '../property/property.entity';
import { UserUpdateDto } from '@src/user/dto/user.update.dto';

@Injectable()
export class UsersDatabaseService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  create(user: User): Promise<UserEntity | null> {
    return this.usersRepository.save(user);
  }

  findAll(): Promise<UserEntity[]> {
    return this.usersRepository.find();
  }

  findOne(id: number, relations?: string[]): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations,
    });
  }

  findOneEmail(email: string, relations?: string[]): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: {
          email,
      },
      relations: relations,
    });
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async makeAdmin(user: UserEntity): Promise<UserEntity | null> {
    user.admin = true;
    return this.usersRepository.save(user);
  }

  async update(user: UserEntity, userUpdated: UserUpdateDto): Promise<UserEntity | null> {
    const updatedUser = this.usersRepository.merge(user, userUpdated);
    const savedUser = await this.usersRepository.save(updatedUser);
    return savedUser;
  }

  async updatePassword(user: UserEntity, password: string): Promise<UserEntity | null> {
    const updatedUser = this.usersRepository.merge(user, { password });
    const savedUser = await this.usersRepository.save(updatedUser);
    return savedUser;
  }

}
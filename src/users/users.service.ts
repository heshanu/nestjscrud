/* eslint-disable prettier/prettier */
import { Injectable,ConflictException,NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    //const newUser = this.usersRepository.create(createUserDto);
     const isExists =await this.usersRepository.findOne({
       where:{email:createUserDto.email}
     });
 
     if(isExists){
            throw new ConflictException('Email already exists');
     }
     const newUser = this.usersRepository.create(createUserDto);
     return this.usersRepository.save(newUser);
   }


async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findAll(page: number = 1, limit: number = 10): Promise<[UserEntity[], number]> {
    return this.usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async deleteUserById(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async updateUserById(email: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ where: { email } });
    
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailExists = await this.usersRepository.findOne({
        where: { email: email }
      });
      
      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
    }
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

}

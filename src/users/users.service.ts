/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UserResponse } from './dto/user.response';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';
import { DatetimeService } from '../datetime/datetime.service';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private rabbitMQService: RabbitMQService,
    private datetimeService: DatetimeService
  ) { }

  findAll(): Promise<UserResponse[]> {
    return this.usersRepository.find();
  }

  // findOne(id: number): Promise<UserResponse|null> {
  //   return this.usersRepository.findOne({ where: { id } });
  // }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async createUser(user: UserResponse): Promise<UserResponse> {
    await this.rabbitMQService.sendMessage(
      `User is created ${this.datetimeService.setDateNotification()}: messages: ${JSON.stringify(user)}`,
      "notification_key"
    );
    return await this.usersRepository.save(user);
  }
}

/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';
import { DatetimeService } from 'src/datetime/datetime.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [UserController],
  providers: [UsersService, RabbitMQService, DatetimeService],
})
export class UsersModule { }

/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Controller, Get, Param, Delete, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserResponse } from './dto/user.response';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
@Controller('users')
export class UserController {
  constructor(private readonly userService: UsersService, private rabbitMQService: RabbitMQService) { }

  @Get()
  findAll(): Promise<UserResponse[]> {
    return this.userService.findAll();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string): Promise<UserResponse|null> {
  //   return this.userService.findOne(+id);
  // }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(+id);
  }

  @Post()
  async createUser(@Body() createUserDto: UserResponse): Promise<UserResponse> {
    return await this.userService.createUser(createUserDto);
  }

  @Get('notification')
  async getMessages(): Promise<string[]> {
    return await this.rabbitMQService.consumeMessages();
  }
}

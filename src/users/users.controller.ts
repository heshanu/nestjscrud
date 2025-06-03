/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
// eslint-disable-next-line prettier/prettier
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { UserEntity } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of users', type: [UserEntity] })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ data: UserEntity[]; count: number; page: number; limit: number }> {
    const [data, count] = await this.usersService.findAll(page, limit);
    return {
      data,
      count,
      page: Number(page),
      limit: Number(limit),
    };
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  async deleteUserById(@Param('id') id: number): Promise<{ message: string }> {
    await this.usersService.deleteUserById(id);
    return { message: `User ${id} Delete successfully` };
  }

  @Patch()
  async updateUser(@Body() updateUserDto:UpdateUserDto): Promise<{ message: string}>{ 
   await this.usersService.updateUserById(updateUserDto.email,updateUserDto);
    return { message: `User ${updateUserDto.email} :Update successfully` };
  }
}

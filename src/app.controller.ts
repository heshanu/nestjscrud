/* eslint-disable prettier/prettier */
import { Controller, Get, Body } from '@nestjs/common';
import { AppService } from './app.service';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  sayHi(): string {
    return this.appService.getHello();
  }
}
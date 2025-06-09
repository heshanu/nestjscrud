/* eslint-disable prettier/prettier */
import { Controller, Get,Body } from '@nestjs/common';
import { AppService } from './app.service';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
    private rabbitMQService: RabbitMQService) { }
  
  @Get()
  async sayHi(): Promise<string> {
    await this.rabbitMQService.consumeMessages();
    return this.appService.getHello();
  }
}
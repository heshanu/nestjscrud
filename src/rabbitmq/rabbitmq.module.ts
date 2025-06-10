/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
@Module({
  providers: [RabbitMQService]
})
export class RabbitmqModule { }

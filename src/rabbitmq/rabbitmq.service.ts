/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  private readonly exchange = 'notification_exchange';
  private readonly queue = 'notification_queue';
  private readonly routingKey = 'notification_key';
  private readonly amqpUrl = 'amqps://vsugjvqr:JS90EdHZcyF5HViP4bMp5rbKhciniWIc@armadillo.rmq.cloudamqp.com/vsugjvqr';

  async onModuleInit() {
    await this.connect();
    await this.setupQueueAndExchange();
    await this.consumeMessages();
  }

  async connect() {
    this.connection = await amqp.connect(this.amqpUrl);
    this.channel = await this.connection.createChannel();
    Logger.log('✅ Connected to RabbitMQ');
  }

  async setupQueueAndExchange() {
    await this.channel.assertExchange(this.exchange, 'direct', { durable: true });
    await this.channel.assertQueue(this.queue, { durable: true });
    await this.channel.bindQueue(this.queue, this.exchange, this.routingKey);

    Logger.log(`📦 Queue "${this.queue}" bound to "${this.exchange}" with routing key "${this.routingKey}"`);
  }

  async sendMessage(message: string, routingKey: string) {
    if (!this.channel) throw new Error('Channel not initialized');
    this.channel.publish(this.exchange, routingKey, Buffer.from(message), {
      persistent: true,
    });

    Logger.log(`📤 Sent "${message}" with routing key "${routingKey}"`);
  }

  async consumeMessages() {
    if (!this.channel) throw new Error('Channel not initialized');

    this.channel.consume(this.queue, (msg) => {
      if (msg !== null) {
        const content = msg.content.toString();
        const rk = msg.fields.routingKey;
        Logger.log(`📥 Received [${rk}]: ${content}`);
        this.channel.ack(msg);
      }
    });
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
    Logger.log('🔌 Connection closed');
  }
}

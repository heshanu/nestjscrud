/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { Module, OnApplicationShutdown, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserEntity } from './users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('TypeOrmConfig');
        const connectionUrl = configService.get<string>('DATABASE_URL');

        if (!connectionUrl) {
          logger.error('DATABASE_URL is missing in environment variables');
          throw new Error('Database connection URL not configured');
        }

        try {
          // Parse and modify connection URL for Neon
          const url = new URL(connectionUrl);

          // Always use pooled connection in production/serverless
          const isServerless = configService.get<string>('SERVERLESS', 'false') === 'true';
          const usePooler = configService.get<string>('NODE_ENV') === 'production' || isServerless;

          if (usePooler) {
            if (!url.hostname.includes('-pooler')) {
              url.hostname = url.hostname.replace('.neon.tech', '-pooler.neon.tech');
            }
            url.searchParams.set('pgbouncer', 'true');
            logger.log('Using Neon connection pooler');
          }

          // Add keepalive parameters
          url.searchParams.set('keepalives', '1');
          url.searchParams.set('keepalives_idle', '30');
          url.searchParams.set('keepalives_interval', '10');
          url.searchParams.set('keepalives_count', '5');

          return {
            type: 'postgres',
            url: url.toString(),
            ssl: { rejectUnauthorized: false },
            entities: [UserEntity],
            synchronize: configService.get<string>('NODE_ENV') !== 'production',
            logging: ['error', 'warn'],
            autoLoadEntities: true,
            extra: {
              connectionTimeoutMillis: 30000, // 30 seconds
              idleTimeoutMillis: 60000,
              max: 5,
              sslmode: 'require',
              ...(isServerless && {
                keepAlive: true,
                keepAliveInitialDelayMillis: 10000,
              }),
            },
          };
        } catch (error) {
          logger.error(`Invalid DATABASE_URL: ${connectionUrl}`,
            error.stack);
          throw new Error('Invalid database connection URL format');
        }
      },
      dataSourceFactory: async (options: any) => {
        const logger = new Logger('DataSource');
        const maxRetries = 3;
        const retryDelay = 5000; // 5 seconds

        let attempt = 1;
        while (attempt <= maxRetries) {
          try {
            logger.log(`Connecting to database (attempt ${attempt}/${maxRetries})...`);
            const dataSource = await new DataSource(options).initialize();
            logger.log('Database connected successfully');
            return dataSource;
          } catch (error) {
            logger.error(`Connection attempt ${attempt} failed: ${error.message}`);
            if (attempt < maxRetries) {
              logger.warn(`Retrying in ${retryDelay / 1000} seconds...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              attempt++;
            } else {
              logger.error(`Database connection failed after ${maxRetries} attempts`);
              throw error;
            }
          }
        }
        throw new Error('Database connection failed after maximum retries');
      },

    }),

    RabbitmqModule,
    UsersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnApplicationShutdown {
  private readonly logger = new Logger(AppModule.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService
  ) { }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Application shutting down (${signal})...`);

    if (this.dataSource.isInitialized) {
      try {
        await this.dataSource.destroy();
        this.logger.log('Database connection closed');
      } catch (error) {
        this.logger.error(`Error closing database connection: ${error.message}`);
      }
    }
  }
}
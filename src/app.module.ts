/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { parse } from 'pg-connection-string';
import { UserEntity } from './users/entities/user.entity'; // Import your entity

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env' // Explicitly specify env file path
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Get DATABASE_URL from environment
        const databaseUrl = config.get('DATABASE_URL');
        
        // Throw error if DATABASE_URL is missing
        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is not defined');
        }
        
        // Parse connection string
        const parsedConfig = parse(databaseUrl);
        
        // Ensure password is always a string (critical fix)
        const password = parsedConfig.password ? String(parsedConfig.password) : '';
        
        return {
          type: 'postgres',
          host: parsedConfig.host || 'localhost',
          port: parseInt(parsedConfig.port || '5432', 10),
          username: parsedConfig.user || 'postgres',
          password: password,
          database: parsedConfig.database || 'postgres',
          entities: [UserEntity], // Use explicit entities instead of glob
          // entities: [__dirname + '/**/*.entity{.ts,.js}'], // Alternative
          synchronize: config.get('NODE_ENV') !== 'production', // Safer
          logging: config.get('NODE_ENV') === 'development',
          ssl: config.get('SSL_MODE') === 'require' ? {
            rejectUnauthorized: false
          } : false,
          // Remove connectionLimit from extra (not needed for Neon)
          extra: {
            sslmode: 'require'
          },
          // Add connection pool settings (recommended)
          poolSize: 10,
          connectTimeoutMS: 2000,
        };
      },
    }),
    UsersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
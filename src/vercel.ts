/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
// src/vercel.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverlessExpress from '@vendia/serverless-express';
import { ValidationPipe } from '@nestjs/common';
import type { Handler, Context, Callback } from 'aws-lambda';

// Global cache for server instance (reduces cold starts)
let cachedServer: Handler;

// Async function to bootstrap the NestJS application
async function bootstrapServer(): Promise<Handler> {
    // Create Express instance
    const expressApp = express();

    // Wrap Express with NestJS using ExpressAdapter
    const adapter = new ExpressAdapter(expressApp);

    // Create Nest application
    const app = await NestFactory.create(AppModule, adapter, {
        // Enable logger only in production
        logger: process.env.NODE_ENV === 'production'
            ? ['error', 'warn']
            : ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    // Add global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        })
    );

    // Enable CORS
    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });

    // Initialize application
    await app.init();

    // Return serverless-express handler
    return serverlessExpress({ app: expressApp });
}

// Export handler function for Vercel/Lambda
export const handler: Handler = async (
    event: any,
    context: Context,
    callback: Callback
) => {
    // Use cached server if available
    if (!cachedServer) {
        cachedServer = await bootstrapServer();
    }

    // Return server handler
    return cachedServer(event, context, callback);
};
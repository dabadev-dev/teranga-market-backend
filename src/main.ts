// import { NestFactory } from '@nestjs/core';
// import type { NestExpressApplication } from '@nestjs/platform-express';
// import { ValidationPipe } from '@nestjs/common';
// import { join } from 'node:path';
// import { AppModule } from './app.module.js';

// async function bootstrap() {
//   const app = await NestFactory.create<NestExpressApplication>(
//     AppModule,
//   );

//   // Autoriser le frontend local et le frontend déployé
//   const allowedOrigins: string[] = [
//   'http://localhost:5173',
//   process.env.FRONTEND_URL,
// ].filter((origin): origin is string => Boolean(origin));

//   app.enableCors({
//     origin: allowedOrigins,
//     credentials: true,
//   });

//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       forbidNonWhitelisted: true,
//       transform: true,
//     }),
//   );

//   // Accès aux images
//   app.useStaticAssets(join(process.cwd(), 'uploads'), {
//     prefix: '/uploads/',
//   });

//   // Port fourni par Render
//   await app.listen(process.env.PORT || 3000);
// }

// bootstrap();

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'node:path';
import { AppModule } from './app.module.js';

import cloudinary from './config/cloudinary.config.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configuration Cloudinary après le chargement du .env
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const allowedOrigins = [
    'http://localhost:5173',
    'https://teranga-market-frontend.vercel.app',
    process.env.FRONTEND_URL,
  ].filter((origin): origin is string => Boolean(origin));

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const port = Number(process.env.PORT) || 3000;

  await app.listen(port, '0.0.0.0');

  console.log(`TerangaMarket démarré sur le port ${port}`);
}

bootstrap();

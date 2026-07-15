import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Strip unknown fields, auto-transform payloads to DTO types, reject invalid input
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors(); // tighten to your mobile app origin(s) in production

  const port = process.env.PORT || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Driver delivery backend running on port ${port}`);
}
bootstrap();

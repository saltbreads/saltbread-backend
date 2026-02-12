import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000'], // 프론트 주소
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false, // 지금은 비로그인이라 false
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  console.log(`🚀 Server is running on http://localhost:${port}`);
}
bootstrap();

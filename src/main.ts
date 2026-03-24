import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // env에서 origin 목록 가져오기
  const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const corsOptions: CorsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // origin 없는 요청 허용 (서버 간 요청 등)
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowed =
        origins.includes(origin) || origin.endsWith('.vercel.app'); //  Vercel 프리뷰 대응

      if (isAllowed) {
        callback(null, true);
        return;
      }

      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  };

  app.enableCors(corsOptions);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  console.log(`Server is running on http://localhost:${port}`);
}

bootstrap();

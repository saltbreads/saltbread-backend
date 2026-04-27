import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FAVORITE_REPOSITORY } from './interface/favorite.repository.interface';
import { FavoritePrismaRepository } from './repositories/favorite.repository.prisma';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [FavoritesController],
  providers: [
    FavoritePrismaRepository,
    { provide: FAVORITE_REPOSITORY, useExisting: FavoritePrismaRepository },
    FavoritesService,
    JwtAuthGuard,
  ],
})
export class FavoritesModule {}

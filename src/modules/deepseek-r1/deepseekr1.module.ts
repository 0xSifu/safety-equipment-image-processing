import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { DeepseekController } from './controllers/deepseek.controller';
import { DeepseekService } from './services/deepseek.service';
import { PrismaService } from 'src/common/services/prisma.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  controllers: [DeepseekController],
  providers: [DeepseekService, PrismaService],
  exports: [DeepseekService],
})
export class DeepseekR1Module {}
import configs from '../config';
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { DeepseekR1Module } from 'src/modules/deepseek-r1/deepseekr1.module';

@Global()
@Module({
  controllers: [],
  imports: [
    DeepseekR1Module,
    ConfigModule.forRoot({
      load: configs,
      isGlobal: true,
      cache: true,
      envFilePath: ['.env'],
      expandVariables: true,
    }),
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class CommonModule {}

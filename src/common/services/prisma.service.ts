import { Injectable, OnModuleInit } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    try {
      await this.$executeRaw`SELECT 1`;
      return {
        prisma: {
          status: 'up',
        },
      };
    } catch (e) {
      return {
        prisma: {
          status: 'down',
        },
      };
    }
  }
}
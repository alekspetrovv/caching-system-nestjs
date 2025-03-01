import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { APP_FILTER } from '@nestjs/core';
import { PrismaClientExceptionFilter } from './prisma-client-exception.filter';
import { PrismaClientValidationExceptionFilter } from './prisma-client-validation-exception.filter';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaClientValidationExceptionFilter,
    },
  ],
})
export class AppModule {}

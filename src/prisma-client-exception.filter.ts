import { Response } from 'express';
import { BaseExceptionFilter } from '@nestjs/core';
import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception?.meta ? exception.meta.cause : exception.message;

    switch (exception.code) {
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          message: `Conflict of unique property '${exception.meta.target[0]}'`,
        });
        break;
      }

      case 'P2003': {
        const status = HttpStatus.UNPROCESSABLE_ENTITY;
        response.status(status).json({
          statusCode: status,
          message: `Foreign key constraint failed on the field '${exception.meta.field_name}'`,
        });
        break;
      }

      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          statusCode: status,
          message,
        });
        break;
      }

      default:
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        response.status(status).json({
          statusCode: status,
          message,
        });
        break;
    }
  }
}

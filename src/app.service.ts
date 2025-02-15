import { Injectable, Logger } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { Caching } from './caching/caching';

@Injectable()
export class AppService {
  cache: Caching;
  private readonly logger = new Logger(AppService.name);
  constructor(private readonly prisma: PrismaService) {
    this.cache = new Caching();
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const user: User = await this.prisma.user.create({
      data,
    });

    this.cache.set(user.id, user);
    this.logger.debug('Added cache for user with id: ' + user.id);
    return this.cache.get(user.id);
  }

  async findOne(id: number): Promise<{ user: User; dataFromCache: boolean }> {
    const dataFromCache = !!this.cache.get(id);
    const user = await this.prisma.user.findFirstOrThrow({
      where: { id },
    });
    this.cache.set(user.id, user);

    return {
      user,
      dataFromCache,
    };
  }

  async getAll(): Promise<{ users: User[]; dataFromCache: boolean }> {
    const dataFromCache = this.cache.map.size > 0;
    const users = await this.prisma.user.findMany();
    if (users.length) {
      for (const user of users) {
        this.cache.set(user.id, user);
      }
      this.logger.debug('Added cache for user missing users');
    }

    return { users: Array.from(this.cache.map.values()), dataFromCache };
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    const user: User = await this.prisma.user.update({
      where: { id },
      data,
    });

    this.cache.set(id, user);
    this.logger.debug('Updated cache for user with id: ' + user.id);
    return this.cache.get(user.id);
  }

  async delete(id: number): Promise<User> {
    if (this.cache.get(id)) {
      this.cache.map.delete(id);
      this.logger.debug('Delete cache for user with id: ' + id);
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}

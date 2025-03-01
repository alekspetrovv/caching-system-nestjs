import { Injectable, Logger } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TtlCaching, UserCache } from './caching/ttl-caching';
const TTL_EXPIRY_MINUTES = 1;

@Injectable()
export class AppService {
  cache: TtlCaching;
  logger: Logger = new Logger(AppService.name);
  constructor(private readonly prisma: PrismaService) {
    this.cache = new TtlCaching();
  }

  async create(data: Prisma.UserCreateInput): Promise<User | UserCache> {
    const ttl: Date = new Date();
    ttl.setMinutes(new Date().getMinutes() + TTL_EXPIRY_MINUTES);

    const user: User = await this.prisma.user.create({
      data,
    });

    this.cache.set(user.id, { ...user, ttl });
    this.logger.debug('Added cache for user with id: ' + user.id);
    return this.cache.get(user.id);
  }

  async findOne(
    id: number,
  ): Promise<{ user: User | UserCache; dataFromCache: boolean }> {
    const ttl: Date = new Date();
    ttl.setMinutes(new Date().getMinutes() + TTL_EXPIRY_MINUTES);

    if (this.cache.get(id)) {
      // renew ttl
      this.cache.set(id, {
        ...this.cache.get(id),
        ttl,
      });

      return {
        user: this.cache.get(id),
        dataFromCache: true,
      };
    }

    const userFromDB = await this.prisma.user.findFirstOrThrow({
      where: { id },
    });

    this.cache.set(id, { ...userFromDB, ttl });

    return {
      user: userFromDB,
      dataFromCache: false,
    };
  }

  async getAll(): Promise<{
    users: User[] | UserCache[];
    dataFromCache: boolean;
  }> {
    const ttl: Date = new Date();
    ttl.setMinutes(new Date().getMinutes() + TTL_EXPIRY_MINUTES);

    const dataFromCache =
      this.cache.map.size > 0 &&
      this.cache.map.size === (await this.prisma.user.count());

    if (!dataFromCache) {
      const users = await this.prisma.user.findMany();
      if (users.length) {
        for (let i = 0; i < users.length; i++) {
          this.cache.set(users[i].id, { ...users[i], ttl });
        }
        this.logger.debug('Added cache for missing users');
      }
    }

    return { users: Array.from(this.cache.map.values()), dataFromCache };
  }

  async update(
    id: number,
    data: Prisma.UserUpdateInput,
  ): Promise<User | UserCache> {
    const ttl: Date = new Date();
    ttl.setMinutes(new Date().getMinutes() + TTL_EXPIRY_MINUTES);

    const user: User = await this.prisma.user.update({
      where: { id },
      data,
    });

    this.cache.set(id, { ...user, ttl });
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

  @Cron(CronExpression.EVERY_MINUTE)
  checkForExpiredUserData(): void {
    const now: Date = new Date();
    for (const [key, value] of this.cache.map.entries()) {
      if (value.ttl.getTime() < now.getTime()) {
        this.cache.delete(key);
      }
    }
  }
}

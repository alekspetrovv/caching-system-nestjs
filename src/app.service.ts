import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { Caching } from './caching/caching';

@Injectable()
export class AppService {
  cache: Caching;
  constructor(private readonly prisma: PrismaService) {
    this.cache = new Caching();
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const user: User = await this.prisma.user.create({
      data,
    });

    this.cache.set(user.id, user);
    return this.cache.get(user.id);
  }

  async findOne(id: number): Promise<User> {
    if (this.cache.get(id)) {
      return this.cache.get(id);
    }

    return this.prisma.user.findFirstOrThrow({
      where: { id },
    });
  }

  async getAll(): Promise<User[] | []> {
    if (this.cache.map.size > 0) {
      return Array.from(this.cache.map.values());
    }

    const users = await this.prisma.user.findMany();
    // add users to cache if missing
    if (users.length) {
      for (const user of users) {
        this.cache.set(user.id, user);
      }
    }

    return Array.from(this.cache.map.values());
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    const user: User = await this.prisma.user.update({
      where: { id },
      data,
    });

    this.cache.set(id, user);
    return this.cache.get(user.id);
  }

  async delete(id: number): Promise<User> {
    if (this.cache.get(id)) {
      this.cache.map.delete(id);
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}

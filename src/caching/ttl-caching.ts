import { User } from '@prisma/client';

export class UserEntity {
  id: number;
  email: string;
  password: string;
}

export class UserCache extends UserEntity {
  ttl: Date;
}

export class TtlCaching {
  map: Map<number, UserCache>;

  constructor() {
    this.map = new Map();
  }

  get(key: number): UserCache {
    return this.map.get(key);
  }

  set(key: number, data: UserCache): void {
    this.map.set(key, data);
  }

  delete(key: number): void {
    this.map.delete(key);
  }
}

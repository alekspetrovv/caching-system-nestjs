import { User } from '@prisma/client';

export class Caching {
  map: Map<number, User>;
  constructor() {
    this.map = new Map();
  }

  get(key: number): User {
    return this.map.get(key);
  }

  set(key: number, value: User): void {
    this.map.set(key, value);
  }
}

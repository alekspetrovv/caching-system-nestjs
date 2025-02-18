import { User } from '@prisma/client';

export class Caching {
  map: Map<number, User>;
  capacity: number;
  constructor(capacity: number) {
    this.map = new Map();
    this.capacity = capacity;
  }

  get(key: number): User {
    return this.map.get(key);
  }

  set(key: number, value: User): void {
    // check if map length is equal to capacity and key does not exist
    if (this.map.size >= this.capacity && !this.map.has(key)) {
      for (const keys of this.map.keys()) {
        this.map.delete(keys);
        break;
      }
    }

    this.map.set(key, value);
  }
}

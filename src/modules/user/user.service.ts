import { eq } from 'drizzle-orm';
import { DbClient } from '@/infra/db';
import { users } from '@/infra/db/db.schema';

interface UserServiceDeps {
  db: DbClient;
}

export default class UserService {
  private readonly db;

  constructor({ db }: UserServiceDeps) {
    this.db = db;
  }

  async getUserById(userId: number) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        password: false,
      },
    });

    return user;
  }
}

import { eq } from 'drizzle-orm';
import { DbClient } from '@/infra/db';
import { users } from '@/infra/db/db.schema';
import { DbValidator, v } from '@/utils/db-validator.util';
import { UpdateUserBody } from './user.schema';

interface UserServiceDeps {
  db: DbClient;
  dbValidator: DbValidator;
}

export default class UserService {
  private readonly db;
  private readonly dbValidator;

  constructor({ db, dbValidator }: UserServiceDeps) {
    this.db = db;
    this.dbValidator = dbValidator;
  }

  async findById(userId: number) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        password: false,
      },
    });

    return user;
  }

  async update(userId: number, userData: UpdateUserBody) {
    await this.dbValidator.validate(
      { email: userData.email },
      {
        email: v.unique({ table: users, column: 'email', ignoreId: userId }),
      },
    );

    await this.db.update(users).set(userData).where(eq(users.id, userId));

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        password: false,
      },
    });

    return user;
  }
}

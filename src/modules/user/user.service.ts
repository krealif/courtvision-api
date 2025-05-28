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

  async update(userId: number, { name, email, photo_url }: UpdateUserBody) {
    await this.dbValidator.validate(
      { email },
      {
        email: v.unique({ table: users, column: 'email', ignoreId: userId }),
      },
    );

    let objectKey: string | undefined;

    if (photo_url) {
      const pathSegments = new URL(photo_url).pathname
        .split('/')
        .filter(Boolean);
      objectKey = pathSegments.slice(1).join('/');
    }

    await this.db
      .update(users)
      .set({
        name,
        email,
        photo_url: objectKey,
      })
      .where(eq(users.id, userId));

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        password: false,
      },
    });

    return user;
  }
}

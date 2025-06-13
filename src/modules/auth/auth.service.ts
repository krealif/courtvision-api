import { compare, hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { DbClient } from '@/infra/db';
import { users } from '@/infra/db/db.schema';
import { DbValidator, v } from '@/utils/db-validator.util';
import { LoginBody, SignupBody } from './auth.schema';

export default class AuthService {
  constructor(
    private readonly db: DbClient,
    private readonly dbValidator: DbValidator,
  ) {}

  async verify({ email, password }: LoginBody) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    const DUMMY_HASH =
      '$2b$10$EBnwuFjIsyKf5GWO79dc7umRsGMzIHkLrSMi3Ers2m8hJYXItx21e';

    const isValid = await compare(password, user?.password ?? DUMMY_HASH);
    if (!user || !isValid) return null;

    return user;
  }

  async create({ name, email, password }: SignupBody) {
    const hashedPassword = await hash(password, 10);

    await this.dbValidator.validate(
      { email },
      {
        email: v.unique({ table: users, column: 'email' }),
      },
    );

    const [result] = await this.db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, result.insertId),
      columns: {
        password: false,
      },
    });

    return user;
  }
}

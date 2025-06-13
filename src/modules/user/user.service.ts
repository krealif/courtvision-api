import { eq } from 'drizzle-orm';
import { DbClient } from '@/infra/db';
import { User, users } from '@/infra/db/db.schema';
import { DbValidator, v } from '@/utils/db-validator.util';
import S3Service from '../s3/s3.service';
import { UpdateUserBody } from './user.schema';

export default class UserService {
  constructor(
    private readonly db: DbClient,
    private readonly dbValidator: DbValidator,
    private readonly s3Service: S3Service,
  ) {}

  async findById(userId: number) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    return user;
  }

  async update(user: User, { name, email, photo_url }: UpdateUserBody) {
    await this.dbValidator.validate(
      { email },
      {
        email: v.unique({ table: users, column: 'email', ignoreId: user.id }),
      },
    );

    let objectKey: string | undefined;

    // If a new photo URL is provided, extract the object key from the full URL
    if (photo_url) {
      const pathSegments = new URL(photo_url).pathname
        .split('/')
        .filter(Boolean);
      objectKey = pathSegments.slice(1).join('/');

      // Remove old photo
      if (user.photo_url) {
        await this.s3Service.deleteObject(user.photo_url);
      }
    }

    await this.db
      .update(users)
      .set({
        name,
        email,
        photo_url: objectKey,
      })
      .where(eq(users.id, user.id));

    const updatedUser = await this.db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        password: false,
      },
    });

    return updatedUser;
  }
}

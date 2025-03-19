import { mysqlTable as table } from 'drizzle-orm/mysql-core';
import * as t from 'drizzle-orm/mysql-core';

export const users = table('users', {
  id: t
    .bigint('id', { mode: 'number', unsigned: true })
    .autoincrement()
    .primaryKey(),
  name: t.varchar('name', { length: 255 }).notNull(),
  email: t.varchar('email', { length: 255 }).notNull().unique(),
  password: t.varchar('password', { length: 255 }).notNull(),
  created_at: t.timestamp('created_at').defaultNow(),
  updated_at: t.timestamp('updated_at').defaultNow(),
});

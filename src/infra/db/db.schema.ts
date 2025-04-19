import { relations } from 'drizzle-orm';
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
  created_at: t.timestamp('created_at').notNull().defaultNow(),
  updated_at: t.timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const videos = table('videos', {
  id: t
    .bigint('id', { mode: 'number', unsigned: true })
    .autoincrement()
    .primaryKey(),
  user_id: t
    .bigint('user_id', { mode: 'number', unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: t.varchar('title', { length: 255 }).notNull(),
  date: t.date('date'),
  venue: t.varchar('venue', { length: 255 }),
  video_url: t.varchar('video_url', { length: 255 }).notNull(),
  thumbnail_url: t.varchar('thumbnail_url', { length: 255 }),
  status: t.varchar('status', { length: 255 }).notNull(),
  created_at: t.timestamp('created_at').notNull().defaultNow(),
  updated_at: t.timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  videos: many(videos),
}));

export const videosRelations = relations(videos, ({ one }) => ({
  user: one(users, {
    fields: [videos.user_id],
    references: [users.id],
  }),
}));

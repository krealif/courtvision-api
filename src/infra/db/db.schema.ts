import { InferSelectModel, relations } from 'drizzle-orm';
import { mysqlTable as table } from 'drizzle-orm/mysql-core';
import * as t from 'drizzle-orm/mysql-core';

export const users = table('users', {
  id: t.bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  name: t.varchar({ length: 255 }).notNull(),
  email: t.varchar({ length: 255 }).notNull().unique(),
  password: t.varchar({ length: 255 }).notNull(),
  photo_url: t.varchar({ length: 255 }),
  created_at: t.timestamp().notNull().defaultNow(),
  updated_at: t.timestamp().notNull().defaultNow().onUpdateNow(),
});
export type User = InferSelectModel<typeof users>;

export enum VideoStatus {
  WAITING = 'waiting',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export const videos = table('videos', {
  id: t.bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  user_id: t
    .bigint({ mode: 'number', unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: t.varchar({ length: 255 }).notNull(),
  date: t.date(),
  venue: t.varchar({ length: 255 }),
  status: t.mysqlEnum(VideoStatus).notNull(),
  video_url: t.varchar({ length: 255 }).notNull(),
  thumbnail_url: t.varchar({ length: 255 }),
  created_at: t.timestamp().notNull().defaultNow(),
  updated_at: t.timestamp().notNull().defaultNow().onUpdateNow(),
});
export type Video = InferSelectModel<typeof videos>;

export const videoResults = table('video_results', {
  id: t.bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  video_id: t
    .bigint({ mode: 'number', unsigned: true })
    .notNull()
    .references(() => videos.id, { onDelete: 'cascade' }),
  court_length_px: t.smallint({ unsigned: true }).notNull(),
  court_width_px: t.smallint({ unsigned: true }).notNull(),
  video_url: t.varchar({ length: 255 }).notNull(),
  tracking: t
    .json()
    .$type<
      {
        frame: number;
        player_id: number;
        team_id: number;
        x: number;
        y: number;
      }[]
    >()
    .notNull(),
  shot: t
    .json()
    .$type<
      {
        result: string;
        frame: number;
        player_id: number;
      }[]
    >()
    .notNull(),
  created_at: t.timestamp().notNull().defaultNow(),
  updated_at: t.timestamp().notNull().defaultNow().onUpdateNow(),
});
export type VideoResult = InferSelectModel<typeof videoResults>;

export const usersRelations = relations(users, ({ many }) => ({
  videos: many(videos),
}));

export const videosRelations = relations(videos, ({ one }) => ({
  user: one(users, {
    fields: [videos.user_id],
    references: [users.id],
  }),
  result: one(videoResults, {
    fields: [videos.id],
    references: [videoResults.video_id],
  }),
}));

export const videoResultsRelations = relations(videoResults, ({ one }) => ({
  video: one(videos, {
    fields: [videoResults.video_id],
    references: [videos.id],
  }),
}));

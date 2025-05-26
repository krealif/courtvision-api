CREATE TABLE `videos` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`date` date,
	`venue` varchar(255),
	`status` enum('waiting','processing','completed','failed') NOT NULL,
	`video_url` varchar(255) NOT NULL,
	`thumbnail_url` varchar(255),
	`video_result` varchar(255),
	`tracking_result` varchar(255),
	`shot_result` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `videos` ADD CONSTRAINT `videos_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;

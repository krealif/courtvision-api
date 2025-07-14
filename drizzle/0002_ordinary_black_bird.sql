CREATE TABLE `video_results` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`video_id` bigint unsigned NOT NULL,
	`court_length_px` smallint unsigned NOT NULL,
	`court_width_px` smallint unsigned NOT NULL,
	`video_url` varchar(255) NOT NULL,
	`tracking` json NOT NULL,
	`shot` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `video_results` ADD CONSTRAINT `video_results_video_id_videos_id_fk` FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE cascade ON UPDATE no action;

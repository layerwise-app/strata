CREATE TABLE `app_secrets` (
	`key` text PRIMARY KEY,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `design_partners` (
	`id` text PRIMARY KEY,
	`email` text NOT NULL UNIQUE,
	`company` text NOT NULL,
	`regions` text NOT NULL,
	`data_size` text NOT NULL,
	`created_at` integer NOT NULL,
	`owner_notified_at` integer
);
--> statement-breakpoint
CREATE TABLE `form_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`visitor_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `design_partners_notified_idx` ON `design_partners` (`owner_notified_at`);--> statement-breakpoint
CREATE INDEX `form_attempts_visitor_idx` ON `form_attempts` (`visitor_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `form_attempts_created_idx` ON `form_attempts` (`created_at`);
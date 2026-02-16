CREATE TABLE `card_metadata` (
	`user_id` text NOT NULL,
	`card_id` text NOT NULL,
	`note_id` text NOT NULL,
	`sibling_tag` text NOT NULL,
	`last_modified` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`seq_no` integer NOT NULL,
	`last_modified_client` text NOT NULL,
	PRIMARY KEY(`user_id`, `card_id`),
	FOREIGN KEY (`last_modified_client`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`,`card_id`) REFERENCES `cards`(`user_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `card_metadata_user_id_seq_no_modified_client_idx` ON `card_metadata` (`user_id`,`seq_no`,`last_modified_client`);
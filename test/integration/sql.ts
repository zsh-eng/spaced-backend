// AUTOGENERATED - DO NOT EDIT: Used for testing
export const schemaString = `
CREATE TABLE \`card_bookmarked\` (
	\`user_id\` text NOT NULL,
	\`card_id\` text NOT NULL,
	\`bookmarked\` integer DEFAULT false NOT NULL,
	\`last_modified\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	\`seq_no\` integer NOT NULL,
	\`last_modified_client\` text NOT NULL,
	PRIMARY KEY(\`user_id\`, \`card_id\`),
	FOREIGN KEY (\`last_modified_client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`user_id\`,\`card_id\`) REFERENCES \`cards\`(\`user_id\`,\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX \`card_bookmarked_user_id_seq_no_modified_client_idx\` ON \`card_bookmarked\` (\`user_id\`,\`seq_no\`,\`last_modified_client\`);--> statement-breakpoint
CREATE TABLE \`card_contents\` (
	\`user_id\` text NOT NULL,
	\`card_id\` text NOT NULL,
	\`front\` text NOT NULL,
	\`back\` text NOT NULL,
	\`last_modified\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	\`seq_no\` integer NOT NULL,
	\`last_modified_client\` text NOT NULL,
	PRIMARY KEY(\`user_id\`, \`card_id\`),
	FOREIGN KEY (\`last_modified_client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`user_id\`,\`card_id\`) REFERENCES \`cards\`(\`user_id\`,\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX \`card_contents_user_id_seq_no_modified_client_idx\` ON \`card_contents\` (\`user_id\`,\`seq_no\`,\`last_modified_client\`);--> statement-breakpoint
CREATE TABLE \`card_decks\` (
	\`user_id\` text NOT NULL,
	\`card_id\` text NOT NULL,
	\`deck_id\` text NOT NULL,
	\`last_modified\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	\`seq_no\` integer NOT NULL,
	\`cl_count\` integer DEFAULT 0 NOT NULL,
	\`last_modified_client\` text NOT NULL,
	PRIMARY KEY(\`user_id\`, \`card_id\`, \`deck_id\`),
	FOREIGN KEY (\`last_modified_client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`user_id\`,\`card_id\`) REFERENCES \`cards\`(\`user_id\`,\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`user_id\`,\`deck_id\`) REFERENCES \`decks\`(\`user_id\`,\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX \`card_decks_user_id_seq_no_modified_client_idx\` ON \`card_decks\` (\`user_id\`,\`seq_no\`,\`last_modified_client\`);--> statement-breakpoint
CREATE TABLE \`card_deleted\` (
	\`user_id\` text NOT NULL,
	\`card_id\` text NOT NULL,
	\`deleted\` integer DEFAULT true NOT NULL,
	\`last_modified\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	\`seq_no\` integer NOT NULL,
	\`last_modified_client\` text NOT NULL,
	PRIMARY KEY(\`user_id\`, \`card_id\`),
	FOREIGN KEY (\`last_modified_client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`user_id\`,\`card_id\`) REFERENCES \`cards\`(\`user_id\`,\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX \`card_deleted_user_id_seq_no_modified_client_idx\` ON \`card_deleted\` (\`user_id\`,\`seq_no\`,\`last_modified_client\`);--> statement-breakpoint
CREATE TABLE \`card_suspended\` (
	\`user_id\` text NOT NULL,
	\`card_id\` text NOT NULL,
	\`suspended\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	\`last_modified\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	\`seq_no\` integer NOT NULL,
	\`last_modified_client\` text NOT NULL,
	PRIMARY KEY(\`user_id\`, \`card_id\`),
	FOREIGN KEY (\`last_modified_client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`user_id\`,\`card_id\`) REFERENCES \`cards\`(\`user_id\`,\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX \`card_suspended_user_id_seq_no_modified_client_idx\` ON \`card_suspended\` (\`user_id\`,\`seq_no\`,\`last_modified_client\`);--> statement-breakpoint
CREATE TABLE \`cards\` (
	\`id\` text NOT NULL,
	\`last_modified\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	\`seq_no\` integer NOT NULL,
	\`user_id\` text NOT NULL,
	\`last_modified_client\` text NOT NULL,
	\`due\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	\`stability\` real NOT NULL,
	\`difficulty\` real NOT NULL,
	\`elapsed_days\` integer NOT NULL,
	\`scheduled_days\` integer NOT NULL,
	\`reps\` integer NOT NULL,
	\`lapses\` integer NOT NULL,
	\`state\` text NOT NULL,
	\`last_review\` integer,
	PRIMARY KEY(\`user_id\`, \`id\`),
	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`last_modified_client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX \`cards_user_id_idx\` ON \`cards\` (\`user_id\`);--> statement-breakpoint
CREATE INDEX \`cards_user_id_seq_no_modified_client_idx\` ON \`cards\` (\`user_id\`,\`seq_no\`,\`last_modified_client\`);--> statement-breakpoint
CREATE TABLE \`clients\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`last_modified\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	\`user_id\` text NOT NULL,
	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`clients_user_id_idx\` ON \`clients\` (\`user_id\`,\`id\`);--> statement-breakpoint
CREATE TABLE \`decks\` (
	\`user_id\` text NOT NULL,
	\`id\` text NOT NULL,
	\`name\` text NOT NULL,
	\`description\` text NOT NULL,
	\`deleted\` integer DEFAULT false NOT NULL,
	\`last_modified\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	\`seq_no\` integer NOT NULL,
	\`last_modified_client\` text NOT NULL,
	PRIMARY KEY(\`user_id\`, \`id\`),
	FOREIGN KEY (\`last_modified_client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX \`decks_user_id_idx\` ON \`decks\` (\`user_id\`);--> statement-breakpoint
CREATE INDEX \`decks_user_id_seq_no_modified_client_idx\` ON \`decks\` (\`user_id\`,\`seq_no\`,\`last_modified_client\`);--> statement-breakpoint
CREATE TABLE \`oauth_accounts\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`user_id\` text NOT NULL,
	\`provider\` text NOT NULL,
	\`provider_user_id\` text NOT NULL,
	\`created_at\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`oauth_accounts_provider_provider_user_id_idx\` ON \`oauth_accounts\` (\`provider\`,\`provider_user_id\`);--> statement-breakpoint
CREATE TABLE \`review_log_deleted\` (
	\`user_id\` text NOT NULL,
	\`review_log_id\` text NOT NULL,
	\`deleted\` integer DEFAULT false NOT NULL,
	\`last_modified\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	\`seq_no\` integer NOT NULL,
	\`last_modified_client\` text NOT NULL,
	PRIMARY KEY(\`user_id\`, \`review_log_id\`),
	FOREIGN KEY (\`last_modified_client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`user_id\`,\`review_log_id\`) REFERENCES \`review_logs\`(\`user_id\`,\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX \`review_log_review_log_id_deleted_user_id_seq_no_modified_client_idx\` ON \`review_log_deleted\` (\`user_id\`,\`seq_no\`,\`last_modified_client\`);--> statement-breakpoint
CREATE TABLE \`review_logs\` (
	\`id\` text NOT NULL,
	\`user_id\` text NOT NULL,
	\`card_id\` text NOT NULL,
	\`seq_no\` integer NOT NULL,
	\`last_modified_client\` text NOT NULL,
	\`grade\` text NOT NULL,
	\`state\` text NOT NULL,
	\`due\` integer NOT NULL,
	\`stability\` real NOT NULL,
	\`difficulty\` real NOT NULL,
	\`elapsed_days\` integer NOT NULL,
	\`last_elapsed_days\` integer NOT NULL,
	\`scheduled_days\` integer NOT NULL,
	\`review\` integer NOT NULL,
	\`duration\` integer DEFAULT 0 NOT NULL,
	\`created_at\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(\`user_id\`, \`id\`),
	FOREIGN KEY (\`last_modified_client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`user_id\`,\`card_id\`) REFERENCES \`cards\`(\`user_id\`,\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX \`review_logs_user_id_card_id_idx\` ON \`review_logs\` (\`user_id\`,\`card_id\`);--> statement-breakpoint
CREATE INDEX \`review_logs_user_id_seq_no_modified_client_idx\` ON \`review_logs\` (\`user_id\`,\`seq_no\`,\`last_modified_client\`);--> statement-breakpoint
CREATE TABLE \`sessions\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`user_id\` text NOT NULL,
	\`valid\` integer DEFAULT true NOT NULL,
	\`created_at\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	\`expires_at\` integer NOT NULL,
	\`last_active_at\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX \`sessions_user_id_idx\` ON \`sessions\` (\`user_id\`);--> statement-breakpoint
CREATE TABLE \`users\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`last_modified\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	\`email\` text NOT NULL,
	\`image_url\` text,
	\`display_name\` text,
	\`is_active\` integer DEFAULT true NOT NULL,
	\`password_hash\` text,
	\`next_seq_no\` integer DEFAULT 1 NOT NULL,
	\`failed_login_attempts\` integer DEFAULT 0 NOT NULL,
	\`password_reset_token\` text,
	\`password_reset_token_expires_at\` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);;
CREATE TABLE \`temp_users\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`email\` text NOT NULL,
	\`password_hash\` text NOT NULL,
	\`created_at\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	\`token\` text NOT NULL,
	\`token_expires_at\` integer NOT NULL,
	\`last_email_sent_at\` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`temp_users_email_idx\` ON \`temp_users\` (\`email\`);;
CREATE TABLE \`files\` (
	\`user_id\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`last_modified\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	\`checksum\` text NOT NULL,
	\`file_type\` text NOT NULL,
	\`metadata\` text NOT NULL,
	\`size_in_bytes\` integer NOT NULL,
	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX \`files_user_id\` ON \`files\` (\`user_id\`);--> statement-breakpoint
CREATE UNIQUE INDEX \`files_userid_checksum_idx\` ON \`files\` (\`user_id\`,\`checksum\`);--> statement-breakpoint
CREATE TABLE \`user_storage_metrics\` (
	\`user_id\` text PRIMARY KEY NOT NULL,
	\`last_modified\` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	\`total_files\` integer DEFAULT 0 NOT NULL,
	\`total_size_in_bytes\` integer DEFAULT 0 NOT NULL,
	\`storage_limit_in_bytes\` integer DEFAULT 104857600 NOT NULL,
	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Below is all the manually written migration code
-- Create a row for each user in the user_storage_metrics table
INSERT INTO \`user_storage_metrics\` (\`user_id\`)
SELECT \`id\` FROM \`users\`;--> statement-breakpoint

-- Before inserting a file, check if the storage limit is exceeded
CREATE TRIGGER IF NOT EXISTS \`check_user_storage_metrics_limit_trigger\`
BEFORE INSERT ON \`files\`
FOR EACH ROW
WHEN (
    (SELECT total_size_in_bytes + NEW.size_in_bytes FROM user_storage_metrics WHERE user_id = NEW.user_id) >
    (SELECT storage_limit_in_bytes FROM user_storage_metrics WHERE user_id = NEW.user_id)
)
BEGIN
    SELECT RAISE(ABORT, 'Storage limit exceeded');
END; --> statement-breakpoint

-- We're assuming that the other trigger will prevent the insert from happening if the storage limit is exceeded
-- After inserting a file, update the total size usage
CREATE TRIGGER IF NOT EXISTS \`insert_file_update_user_storage_metrics_trigger\`
AFTER INSERT ON \`files\`
FOR EACH ROW
BEGIN
	UPDATE \`user_storage_metrics\` SET \`total_size_in_bytes\` = \`total_size_in_bytes\` + NEW.\`size_in_bytes\` WHERE \`user_id\` = NEW.\`user_id\`;
END;--> statement-breakpoint

-- After deleting a file, update the total size usage
CREATE TRIGGER IF NOT EXISTS \`delete_file_update_user_storage_metrics_trigger\`
AFTER DELETE ON \`files\`
FOR EACH ROW
BEGIN
	UPDATE \`user_storage_metrics\` SET \`total_size_in_bytes\` = \`total_size_in_bytes\` - OLD.\`size_in_bytes\` WHERE \`user_id\` = OLD.\`user_id\`;
END;--> statement-breakpoint
;
`;

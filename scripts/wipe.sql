PRAGMA foreign_keys = OFF;
DROP INDEX IF EXISTS `users_email_idx`;
DROP TABLE IF EXISTS `users`;
DROP INDEX IF EXISTS `sessions_user_id_idx`;
DROP TABLE IF EXISTS `sessions`;
DROP INDEX IF EXISTS `review_logs_user_id_seq_no_modified_client_idx`;
DROP INDEX IF EXISTS `review_logs_user_id_card_id_idx`;
DROP TABLE IF EXISTS `review_logs`;
DROP INDEX IF EXISTS `review_log_review_log_id_deleted_user_id_seq_no_modified_client_idx`;
DROP TABLE IF EXISTS `review_log_deleted`;
DROP INDEX IF EXISTS `oauth_accounts_provider_provider_user_id_idx`;
DROP TABLE IF EXISTS `oauth_accounts`;
DROP INDEX IF EXISTS `decks_user_id_seq_no_modified_client_idx`;
DROP INDEX IF EXISTS `decks_user_id_idx`;
DROP TABLE IF EXISTS `decks`;
DROP INDEX IF EXISTS `clients_user_id_idx`;
DROP TABLE IF EXISTS `clients`;
DROP INDEX IF EXISTS `cards_user_id_seq_no_modified_client_idx`;
DROP INDEX IF EXISTS `cards_user_id_idx`;
DROP TABLE IF EXISTS `cards`;
DROP INDEX IF EXISTS `card_suspended_user_id_seq_no_modified_client_idx`;
DROP TABLE IF EXISTS `card_suspended`;
DROP INDEX IF EXISTS `card_deleted_user_id_seq_no_modified_client_idx`;
DROP TABLE IF EXISTS `card_deleted`;
DROP INDEX IF EXISTS `card_decks_user_id_seq_no_modified_client_idx`;
DROP TABLE IF EXISTS `card_decks`;
DROP INDEX IF EXISTS `card_contents_user_id_seq_no_modified_client_idx`;
DROP TABLE IF EXISTS `card_contents`;
DROP INDEX IF EXISTS `card_bookmarked_user_id_seq_no_modified_client_idx`;
DROP TABLE IF EXISTS `card_bookmarked`;
PRAGMA foreign_keys = ON;

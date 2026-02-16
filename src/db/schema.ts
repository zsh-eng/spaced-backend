import { relations, sql } from 'drizzle-orm';
import {
	foreignKey,
	index,
	integer,
	primaryKey,
	real,
	sqliteTable,
	text,
	unique,
	uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const states = ['New', 'Learning', 'Review', 'Relearning'] as const;
export type State = (typeof states)[number];

export const ratings = ['Manual', 'Easy', 'Good', 'Hard', 'Again'] as const;
export type Rating = (typeof ratings)[number];

export const tempUsers = sqliteTable(
	'temp_users',
	{
		id: text('id').primaryKey(),
		email: text('email').notNull(),
		passwordHash: text('password_hash').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		token: text('token').notNull(),
		tokenExpiresAt: integer('token_expires_at', { mode: 'timestamp_ms' }).notNull(),
		lastEmailSentAt: integer('last_email_sent_at', { mode: 'timestamp_ms' })
			.default(sql`(unixepoch() * 1000)`)
			.notNull(),
	},
	(table) => [uniqueIndex('temp_users_email_idx').on(table.email)]
);

export type TempUser = typeof tempUsers.$inferSelect;

export const users = sqliteTable(
	'users',
	{
		id: text('id').primaryKey(),
		lastModified: integer('last_modified', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		email: text('email').notNull(),
		imageUrl: text('image_url'),
		displayName: text('display_name'),

		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		passwordHash: text('password_hash'),
		nextSeqNo: integer('next_seq_no').notNull().default(1),
		failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
		passwordResetToken: text('password_reset_token'),
		passwordResetTokenExpiresAt: integer('password_reset_token_expires_at', {
			mode: 'timestamp_ms',
		}),
	},
	(table) => [uniqueIndex('users_email_idx').on(table.email)]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const oauthProviders = ['google'] as const;
export type OAuthProvider = (typeof oauthProviders)[number];

export const oauthAccounts = sqliteTable(
	'oauth_accounts',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		provider: text('provider', { enum: oauthProviders }).notNull(),
		providerUserId: text('provider_user_id').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
	},
	(table) => [
		unique('oauth_accounts_provider_provider_user_id_idx').on(table.provider, table.providerUserId),
	]
);

export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert;

export const sessions = sqliteTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		valid: integer('valid', { mode: 'boolean' }).notNull().default(true),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		lastActiveAt: integer('last_active_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
	},
	(table) => [index('sessions_user_id_idx').on(table.userId)]
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export const clients = sqliteTable(
	'clients',
	{
		id: text('id').primaryKey(),
		lastModified: integer('last_modified', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
	},
	(table) => [unique('clients_user_id_idx').on(table.userId, table.id)]
);

export const cards = sqliteTable(
	'cards',
	{
		id: text('id').notNull(),
		lastModified: integer('last_modified', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		seqNo: integer('seq_no').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		lastModifiedClient: text('last_modified_client')
			.notNull()
			.references(() => clients.id),

		// Variables for cards
		due: integer('due', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		stability: real('stability').notNull(),
		difficulty: real('difficulty').notNull(),
		elapsed_days: integer('elapsed_days').notNull(),
		scheduled_days: integer('scheduled_days').notNull(),
		reps: integer('reps').notNull(),
		lapses: integer('lapses').notNull(),
		state: text('state', { enum: states }).notNull(),
		last_review: integer('last_review', { mode: 'timestamp_ms' }),
	},
	(table) => [
		primaryKey({
			columns: [table.userId, table.id],
		}),
		index('cards_user_id_idx').on(table.userId),
		index('cards_user_id_seq_no_modified_client_idx').on(
			table.userId,
			table.seqNo,
			table.lastModifiedClient
		),
	]
);

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;

export const reviewLogs = sqliteTable(
	'review_logs',
	{
		id: text('id').notNull(),
		userId: text('user_id').notNull(),
		cardId: text('card_id').notNull(),
		seqNo: integer('seq_no').notNull(),
		lastModifiedClient: text('last_modified_client')
			.notNull()
			.references(() => clients.id),

		grade: text('grade', { enum: ratings }).notNull(),
		state: text('state', { enum: states }).notNull(),

		due: integer('due', { mode: 'timestamp_ms' }).notNull(),
		stability: real('stability').notNull(),
		difficulty: real('difficulty').notNull(),
		elapsed_days: integer('elapsed_days').notNull(),
		last_elapsed_days: integer('last_elapsed_days').notNull(),
		scheduled_days: integer('scheduled_days').notNull(),
		review: integer('review', { mode: 'timestamp_ms' }).notNull(),
		duration: integer('duration').notNull().default(0),

		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
	},
	(table) => [
		primaryKey({
			columns: [table.userId, table.id],
		}),
		foreignKey({
			columns: [table.userId, table.cardId],
			foreignColumns: [cards.userId, cards.id],
		}),
		index('review_logs_user_id_card_id_idx').on(table.userId, table.cardId),
		index('review_logs_user_id_seq_no_modified_client_idx').on(
			table.userId,
			table.seqNo,
			table.lastModifiedClient
		),
	]
);

export type ReviewLog = typeof reviewLogs.$inferSelect;

export const reviewLogDeleted = sqliteTable(
	'review_log_deleted',
	{
		userId: text('user_id').notNull(),
		reviewLogId: text('review_log_id').notNull(),
		deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
		lastModified: integer('last_modified', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		seqNo: integer('seq_no').notNull(),
		lastModifiedClient: text('last_modified_client')
			.notNull()
			.references(() => clients.id),
	},
	(table) => [
		primaryKey({
			columns: [table.userId, table.reviewLogId],
		}),
		foreignKey({
			columns: [table.userId, table.reviewLogId],
			foreignColumns: [reviewLogs.userId, reviewLogs.id],
		}),
		index('review_log_review_log_id_deleted_user_id_seq_no_modified_client_idx').on(
			table.userId,
			table.seqNo,
			table.lastModifiedClient
		),
	]
);
export type ReviewLogDeleted = typeof reviewLogDeleted.$inferSelect;

export const cardContents = sqliteTable(
	'card_contents',
	{
		userId: text('user_id').notNull(),
		cardId: text('card_id').notNull(),
		front: text('front').notNull(),
		back: text('back').notNull(),
		lastModified: integer('last_modified', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		seqNo: integer('seq_no').notNull(),
		lastModifiedClient: text('last_modified_client')
			.notNull()
			.references(() => clients.id),
	},
	(table) => [
		primaryKey({
			columns: [table.userId, table.cardId],
		}),
		foreignKey({
			columns: [table.userId, table.cardId],
			foreignColumns: [cards.userId, cards.id],
		}),
		index('card_contents_user_id_seq_no_modified_client_idx').on(
			table.userId,
			table.seqNo,
			table.lastModifiedClient
		),
	]
);

export type CardContent = typeof cardContents.$inferSelect;

export const cardDeleted = sqliteTable(
	'card_deleted',
	{
		userId: text('user_id').notNull(),
		cardId: text('card_id').notNull(),
		deleted: integer('deleted', { mode: 'boolean' }).notNull().default(true),
		lastModified: integer('last_modified', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		seqNo: integer('seq_no').notNull(),
		lastModifiedClient: text('last_modified_client')
			.notNull()
			.references(() => clients.id),
	},
	(table) => [
		primaryKey({
			columns: [table.userId, table.cardId],
		}),
		foreignKey({
			columns: [table.userId, table.cardId],
			foreignColumns: [cards.userId, cards.id],
		}),
		index('card_deleted_user_id_seq_no_modified_client_idx').on(
			table.userId,
			table.seqNo,
			table.lastModifiedClient
		),
	]
);

export type CardDeleted = typeof cardDeleted.$inferSelect;

// We use LWW strategy for bookmarks rather than CLSet
// because it makes more sense that the latest operation is the one that the client
// wants to execute
// And someone might bookmark/unbookmark a card multiple times
// so we the incrementing counter for CLset does not best represent the intention of the user.
export const cardBookmarked = sqliteTable(
	'card_bookmarked',
	{
		userId: text('user_id').notNull(),
		cardId: text('card_id').notNull(),
		bookmarked: integer('bookmarked', { mode: 'boolean' }).notNull().default(false),
		lastModified: integer('last_modified', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		seqNo: integer('seq_no').notNull(),
		lastModifiedClient: text('last_modified_client')
			.notNull()
			.references(() => clients.id),
	},
	(table) => [
		primaryKey({
			columns: [table.userId, table.cardId],
		}),
		foreignKey({
			columns: [table.userId, table.cardId],
			foreignColumns: [cards.userId, cards.id],
		}),
		index('card_bookmarked_user_id_seq_no_modified_client_idx').on(
			table.userId,
			table.seqNo,
			table.lastModifiedClient
		),
	]
);

export type CardBookmarked = typeof cardBookmarked.$inferSelect;

export const cardSuspended = sqliteTable(
	'card_suspended',
	{
		userId: text('user_id').notNull(),
		cardId: text('card_id').notNull(),
		suspended: integer('suspended', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		lastModified: integer('last_modified', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		seqNo: integer('seq_no').notNull(),
		lastModifiedClient: text('last_modified_client')
			.notNull()
			.references(() => clients.id),
	},
	(table) => [
		primaryKey({
			columns: [table.userId, table.cardId],
		}),
		foreignKey({
			columns: [table.userId, table.cardId],
			foreignColumns: [cards.userId, cards.id],
		}),
		index('card_suspended_user_id_seq_no_modified_client_idx').on(
			table.userId,
			table.seqNo,
			table.lastModifiedClient
		),
	]
);

export type CardSuspended = typeof cardSuspended.$inferSelect;

export const cardMetadata = sqliteTable(
	'card_metadata',
	{
		userId: text('user_id').notNull(),
		cardId: text('card_id').notNull(),
		noteId: text('note_id').notNull(),
		siblingTag: text('sibling_tag').notNull(),
		lastModified: integer('last_modified', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		seqNo: integer('seq_no').notNull(),
		lastModifiedClient: text('last_modified_client')
			.notNull()
			.references(() => clients.id),
	},
	(table) => [
		primaryKey({
			columns: [table.userId, table.cardId],
		}),
		foreignKey({
			columns: [table.userId, table.cardId],
			foreignColumns: [cards.userId, cards.id],
		}),
		index('card_metadata_user_id_seq_no_modified_client_idx').on(
			table.userId,
			table.seqNo,
			table.lastModifiedClient
		),
	]
);

export type CardMetadata = typeof cardMetadata.$inferSelect;

export const decks = sqliteTable(
	'decks',
	{
		userId: text('user_id').notNull(),
		id: text('id').notNull(),
		name: text('name').notNull(),
		description: text('description').notNull(),
		deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
		lastModified: integer('last_modified', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		seqNo: integer('seq_no').notNull(),
		lastModifiedClient: text('last_modified_client')
			.notNull()
			.references(() => clients.id),
	},
	(table) => [
		primaryKey({
			columns: [table.userId, table.id],
		}),
		index('decks_user_id_idx').on(table.userId),
		index('decks_user_id_seq_no_modified_client_idx').on(
			table.userId,
			table.seqNo,
			table.lastModifiedClient
		),
	]
);

export type Deck = typeof decks.$inferSelect;

export const cardDecks = sqliteTable(
	'card_decks',
	{
		userId: text('user_id').notNull(),
		cardId: text('card_id').notNull(),
		deckId: text('deck_id').notNull(),
		lastModified: integer('last_modified', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		seqNo: integer('seq_no').notNull(),
		clCount: integer('cl_count').notNull().default(0),
		lastModifiedClient: text('last_modified_client')
			.notNull()
			.references(() => clients.id),
	},
	(table) => [
		primaryKey({
			columns: [table.userId, table.cardId, table.deckId],
		}),
		foreignKey({
			columns: [table.userId, table.cardId],
			// we could choose either as the "primary" but let's just use cardId
			foreignColumns: [cards.userId, cards.id],
		}),
		foreignKey({
			columns: [table.userId, table.deckId],
			foreignColumns: [decks.userId, decks.id],
		}),
		index('card_decks_user_id_seq_no_modified_client_idx').on(
			table.userId,
			table.seqNo,
			table.lastModifiedClient
		),
	]
);

export type CardDeck = typeof cardDecks.$inferSelect;

// Files

export const files = sqliteTable(
	'files',
	{
		userId: text('user_id').notNull(),
		// File key for the file in the bucket
		// Excludes the user id
		id: text('id').primaryKey(),
		lastModified: integer('last_modified', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		checksum: text('checksum').notNull(),
		fileType: text('file_type').notNull(),
		// Each type of file can have a different metadata schema
		metadata: text('metadata', { mode: 'json' }).notNull(),
		sizeInBytes: integer('size_in_bytes').notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
		}),
		index('files_user_id').on(table.userId),
		uniqueIndex('files_userid_checksum_idx').on(table.userId, table.checksum),
	]
);

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;

// The total size in bytes is updated by triggers on the `files` table
export const userStorageMetrics = sqliteTable(
	'user_storage_metrics',
	{
		userId: text('user_id').notNull(),
		lastModified: integer('last_modified', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		totalFiles: integer('total_files').notNull().default(0),
		// For MB/GB we don't need to worry about integer overflow
		totalSizeInBytes: integer('total_size_in_bytes').notNull().default(0),
		storageLimitInBytes: integer('storage_limit_in_bytes')
			.notNull()
			.default(100 * 1024 * 1024),
	},
	(table) => [
		primaryKey({
			columns: [table.userId],
		}),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
		}),
	]
);

export type UserStorageMetrics = typeof userStorageMetrics.$inferSelect;
// Relations

export const usersRelations = relations(users, ({ many, one }) => ({
	sessions: many(sessions),
	clients: many(clients),
	cards: many(cards),
	reviewLogs: many(reviewLogs),
	reviewLogDeleted: many(reviewLogDeleted),
	cardContents: many(cardContents),
	cardDeleted: many(cardDeleted),
	cardBookmarked: many(cardBookmarked),
	cardSuspended: many(cardSuspended),
	cardMetadata: many(cardMetadata),
	decks: many(decks),
	cardDecks: many(cardDecks),
	oauthAccounts: many(oauthAccounts),
	files: many(files),
	userStorageMetrics: one(userStorageMetrics),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
	user: one(users, {
		fields: [oauthAccounts.userId],
		references: [users.id],
	}),
}));

export const clientsRelations = relations(clients, ({ one }) => ({
	user: one(users, {
		fields: [clients.userId],
		references: [users.id],
	}),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
	user: one(users, {
		fields: [cards.userId],
		references: [users.id],
	}),
	cardContents: one(cardContents),
	cardDeleted: one(cardDeleted),
	cardBookmarked: one(cardBookmarked),
	cardSuspended: one(cardSuspended),
	cardMetadata: one(cardMetadata),
	cardDecks: many(cardDecks),
	reviewLogs: many(reviewLogs),
}));

export const reviewLogsRelations = relations(reviewLogs, ({ one }) => ({
	card: one(cards, {
		fields: [reviewLogs.cardId],
		references: [cards.id],
	}),
	reviewLogDeleted: one(reviewLogDeleted),
	user: one(users, {
		fields: [reviewLogs.userId],
		references: [users.id],
	}),
}));

export const reviewLogDeletedRelations = relations(reviewLogDeleted, ({ one }) => ({
	reviewLog: one(reviewLogs, {
		fields: [reviewLogDeleted.reviewLogId],
		references: [reviewLogs.id],
	}),
	user: one(users, {
		fields: [reviewLogDeleted.userId],
		references: [users.id],
	}),
}));

export const cardContentsRelations = relations(cardContents, ({ one }) => ({
	card: one(cards, {
		fields: [cardContents.cardId],
		references: [cards.id],
	}),
	user: one(users, {
		fields: [cardContents.userId],
		references: [users.id],
	}),
}));

export const cardDeletedRelations = relations(cardDeleted, ({ one }) => ({
	card: one(cards, {
		fields: [cardDeleted.cardId],
		references: [cards.id],
	}),
	user: one(users, {
		fields: [cardDeleted.userId],
		references: [users.id],
	}),
}));

export const cardBookmarkedRelations = relations(cardBookmarked, ({ one }) => ({
	card: one(cards, {
		fields: [cardBookmarked.userId, cardBookmarked.cardId],
		references: [cards.userId, cards.id],
	}),
	user: one(users, {
		fields: [cardBookmarked.userId],
		references: [users.id],
	}),
}));

export const cardSuspendedRelations = relations(cardSuspended, ({ one }) => ({
	card: one(cards, {
		fields: [cardSuspended.cardId],
		references: [cards.id],
	}),
	user: one(users, {
		fields: [cardSuspended.userId],
		references: [users.id],
	}),
}));

export const cardMetadataRelations = relations(cardMetadata, ({ one }) => ({
	card: one(cards, {
		fields: [cardMetadata.userId, cardMetadata.cardId],
		references: [cards.userId, cards.id],
	}),
	user: one(users, {
		fields: [cardMetadata.userId],
		references: [users.id],
	}),
}));

export const decksRelations = relations(decks, ({ many, one }) => ({
	cardDecks: many(cardDecks),
	user: one(users, {
		fields: [decks.userId],
		references: [users.id],
	}),
}));

export const cardDecksRelations = relations(cardDecks, ({ one }) => ({
	user: one(users, {
		fields: [cardDecks.userId],
		references: [users.id],
	}),
	card: one(cards, {
		fields: [cardDecks.cardId],
		references: [cards.id],
	}),
	deck: one(decks, {
		fields: [cardDecks.deckId],
		references: [decks.id],
	}),
}));

export const filesRelations = relations(files, ({ one }) => ({
	user: one(users, {
		fields: [files.userId],
		references: [users.id],
	}),
}));

export const userStorageMetricsRelations = relations(userStorageMetrics, ({ one }) => ({
	user: one(users, {
		fields: [userStorageMetrics.userId],
		references: [users.id],
	}),
}));

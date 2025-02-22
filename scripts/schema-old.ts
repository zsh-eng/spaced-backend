import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// This file contains the schema for the database.
// Note that timestamp, boolean, and enum are not supported in SQLite.
// The enum type is used for type inference, and not enforced in the database.
// See https://orm.drizzle.team/docs/column-types/sqlite#text

export const userRoles = ["basic", "premium", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

// Accounts schema
// See https://authjs.dev/getting-started/adapters/drizzle
export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  role: text("role", { enum: userRoles }).notNull().default("basic"),
});

export type NewUser = typeof users.$inferInsert;
export type User = Omit<typeof users.$inferSelect, "emailVerified">;

export const userMedia = sqliteTable(
  "user_media",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    url: text("url").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    userMediaUserIdIndx: index("user_media_user_id_indx").on(table.userId),
    userMediaUserIdCreatedAtIndx: index("user_media_user_id_created_at_indx").on(
      table.userId,
      table.createdAt,
    ),
  }),
);

export type NewUserMedia = typeof userMedia.$inferInsert;
export type UserMedia = typeof userMedia.$inferSelect;

export const userMediaRelations = relations(userMedia, ({ one }) => ({
  user: one(users, {
    fields: [userMedia.userId],
    references: [users.id],
  }),
}));

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export type NewAccount = typeof accounts.$inferInsert;

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export type NewSession = typeof sessions.$inferInsert;

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

// See https://open-spaced-repetition.github.io/ts-fsrs/

// Parameters

export const states = ["New", "Learning", "Review", "Relearning"] as const;
export type State = (typeof states)[number];

export const ratings = ["Manual", "Again", "Hard", "Good", "Easy"] as const;
export type Rating = (typeof ratings)[number];

export const reviewLogs = sqliteTable(
  "review_logs",
  {
    id: text("id").primaryKey(),
    cardId: text("card_id").notNull(),
    grade: text("grade", { enum: ratings }).notNull(),
    state: text("state", { enum: states }).notNull(),

    due: integer("due", { mode: "timestamp" }).notNull(),
    stability: real("stability").notNull(),
    difficulty: real("difficulty").notNull(),
    elapsed_days: integer("elapsed_days").notNull(),
    last_elapsed_days: integer("last_elapsed_days").notNull(),
    scheduled_days: integer("scheduled_days").notNull(),
    review: integer("review", { mode: "timestamp" }).notNull(),
    duration: integer("duration").notNull().default(0),
    deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => {
    return {
      reviewLogsCardIdIndx: index("review_logs_card_id_indx").on(table.cardId),
      reviewLogsCreatedAtIndx: index("review_logs_created_at_indx").on(
        table.createdAt,
      ),
    };
  },
);

export type ReviewLog = typeof reviewLogs.$inferSelect;
export type NewReviewLog = typeof reviewLogs.$inferInsert;

// * For now we just copy the schema from the ts-fsrs-demo example
// Note that some fields use snake case here for compatiblity with the ts-fsrs library
// TODO standardise to using camelCase and write a converter
export const cards = sqliteTable(
  "cards",
  {
    id: text("id").primaryKey(),
    due: integer("due", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`), // https://orm.drizzle.team/learn/guides/timestamp-default-value
    stability: real("stability").notNull(),
    difficulty: real("difficulty").notNull(),
    elapsed_days: integer("elapsed_days").notNull(),
    scheduled_days: integer("scheduled_days").notNull(),
    reps: integer("reps").notNull(),
    lapses: integer("lapses").notNull(),
    state: text("state", { enum: states }).notNull(),
    last_review: integer("last_review", { mode: "timestamp" }),

    // The time the card is suspended until
    suspended: integer("suspended", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),

    userId: text("user_id").notNull(),

    // revlogs logs
    deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => {
    return {
      cardsUserIdIndx: index("cards_user_id_indx").on(table.userId),
      // cards are sorted by user ID first, then the others
      cardsUserIdCreatedAtIndx: index("cards_user_id_created_at_indx").on(
        table.userId,
        table.createdAt,
      ),
      cardsUserIdDifficultyIndx: index("cards_user_id_difficulty_indx").on(
        table.userId,
        table.difficulty,
      ),
    };
  },
);
// Benchmark performance to check if we should use indexes for difficulty and due
// columns.

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;

// TODO rename to camelCase
export const cardContents = sqliteTable(
  "card_contents",
  {
    id: text("id").primaryKey(),
    // card
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),

    question: text("question").notNull().default(""),
    answer: text("answer").notNull().default(""),
    source: text("source").notNull().default(""),
    sourceId: text("sourceId"),
    extend: text("extend", { mode: "json" }),
    deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => {
    return {
      cardContentscardIdIndx: uniqueIndex("card_contents_card_id_indx").on(
        table.cardId,
      ),
    };
  },
);

export type CardContent = typeof cardContents.$inferSelect;
export type NewCardContent = typeof cardContents.$inferInsert;

export const decks = sqliteTable(
  "decks",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    userId: text("user_id").notNull(),
  },
  (table) => {
    return {
      decksUserIdIndx: index("decks_user_id_indx").on(table.userId),
    };
  },
);

export type Deck = typeof decks.$inferSelect;
export type NewDeck = typeof decks.$inferInsert;

// https://orm.drizzle.team/docs/rqb#many-to-many
// TODO: check behaviour of deletes on this many-to-many table
export const cardsToDecks = sqliteTable(
  "cards_to_decks",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    deckId: text("deck_id")
      .notNull()
      .references(() => decks.id, {
        onDelete: "cascade",
      }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.cardId, t.deckId] }),
  }),
);

export type CardsToDecks = typeof cardsToDecks.$inferSelect;
export type NewCardsToDecks = typeof cardsToDecks.$inferInsert;

/**
 * Keeps track of token usage for any LLM models.
 * Usage is tied to the user for billing purposes.
 */
export const aiModelUsages = sqliteTable(
  "ai_model_usages",
  {
    id: text("id").primaryKey(),
    model: text("model").notNull(),
    promptTokens: integer("prompt_tokens").notNull(),
    completionTokens: integer("completion_tokens").notNull(),
    totalTokens: integer("total_tokens").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
  },
  (table) => {
    return {
      aiModelUserIdIndx: index("ai_model_usage_user_id_indx").on(table.userId),
    };
  },
);

export type AIModelUsage = typeof aiModelUsages.$inferSelect;
export type NewAIModelUsage = typeof aiModelUsages.$inferInsert;

export const reviewLogsRelations = relations(reviewLogs, ({ one }) => ({
  card: one(cards, {
    fields: [reviewLogs.cardId],
    references: [cards.id],
  }),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  reviewLogs: many(reviewLogs),
  cardsToDecks: many(cardsToDecks),
  users: one(users, {
    fields: [cards.userId],
    references: [users.id],
  }),
}));

export const cardContentsRelations = relations(cardContents, ({ one }) => ({
  card: one(cards, {
    fields: [cardContents.cardId],
    references: [cards.id],
  }),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
  cardsToDecks: many(cardsToDecks),
  users: one(users, {
    fields: [decks.userId],
    references: [users.id],
  }),
}));

export const cardsToDecksRelations = relations(cardsToDecks, ({ one }) => ({
  card: one(cards, {
    fields: [cardsToDecks.cardId],
    references: [cards.id],
  }),
  deck: one(decks, {
    fields: [cardsToDecks.deckId],
    references: [decks.id],
  }),
}));

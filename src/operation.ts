import * as schema from '@/db/schema';
import { Card } from '@/db/schema';
import { z } from 'zod';

export type StripMetadata<T> = Omit<T, 'seqNo' | 'lastModifiedClient' | 'userId' | 'lastModified'>;

export type CardOperation = {
	type: 'card';
	payload: StripMetadata<Card>;
	timestamp: number;
};

export const cardOperationSchema = z.object({
	type: z.literal('card'),
	payload: z.object({
		id: z.string(),
		// card variables
		due: z.coerce.date(),
		stability: z.number(),
		difficulty: z.number(),
		elapsed_days: z.number(),
		scheduled_days: z.number(),
		reps: z.number(),
		lapses: z.number(),
		state: z.enum(schema.states),
		last_review: z.coerce.date().nullable(),
	}),
	timestamp: z.number(),
}) satisfies z.ZodType<CardOperation>;

export type ReviewLogOperation = {
	type: 'reviewLog';
	payload: StripMetadata<schema.ReviewLog>;
	timestamp: number;
};

export const reviewLogOperationSchema = z.object({
	type: z.literal('reviewLog'),
	payload: z.object({
		id: z.string(),
		cardId: z.string(),

		grade: z.enum(schema.ratings),
		state: z.enum(schema.states),

		due: z.coerce.date(),
		stability: z.number(),
		difficulty: z.number(),
		elapsed_days: z.number(),
		last_elapsed_days: z.number(),
		scheduled_days: z.number(),
		review: z.coerce.date(),
		duration: z.number(),

		createdAt: z.coerce.date(),
	}),
	timestamp: z.number(),
}) satisfies z.ZodType<ReviewLogOperation>;

export type ReviewLogDeletedOperation = {
	type: 'reviewLogDeleted';
	payload: StripMetadata<schema.ReviewLogDeleted>;
	timestamp: number;
};

export const reviewLogDeletedOperationSchema = z.object({
	type: z.literal('reviewLogDeleted'),
	payload: z.object({
		reviewLogId: z.string(),
		deleted: z.boolean(),
	}),
	timestamp: z.number(),
}) satisfies z.ZodType<ReviewLogDeletedOperation>;

export type CardContentOperation = {
	type: 'cardContent';
	payload: StripMetadata<schema.CardContent>;
	timestamp: number;
};

export const cardContentOperationSchema = z.object({
	type: z.literal('cardContent'),
	payload: z.object({
		cardId: z.string(),
		front: z.string(),
		back: z.string(),
	}),
	timestamp: z.number(),
}) satisfies z.ZodType<CardContentOperation>;

export type CardDeletedOperation = {
	type: 'cardDeleted';
	payload: StripMetadata<schema.CardDeleted>;
	timestamp: number;
};

export const cardDeletedOperationSchema = z.object({
	type: z.literal('cardDeleted'),
	payload: z.object({
		cardId: z.string(),
		deleted: z.boolean(),
	}),
	timestamp: z.number(),
}) satisfies z.ZodType<CardDeletedOperation>;

export type CardBookmarkedOperation = {
	type: 'cardBookmarked';
	payload: StripMetadata<schema.CardBookmarked>;
	timestamp: number;
};

export const cardBookmarkedOperationSchema = z.object({
	type: z.literal('cardBookmarked'),
	payload: z.object({
		cardId: z.string(),
		bookmarked: z.boolean(),
	}),
	timestamp: z.number(),
}) satisfies z.ZodType<CardBookmarkedOperation>;

export type CardSuspendedOperation = {
	type: 'cardSuspended';
	payload: StripMetadata<schema.CardSuspended>;
	timestamp: number;
};

export const cardSuspendedOperationSchema = z.object({
	type: z.literal('cardSuspended'),
	payload: z.object({
		cardId: z.string(),
		suspended: z.coerce.date(),
	}),
	timestamp: z.number(),
}) satisfies z.ZodType<CardSuspendedOperation>;

export type CardMetadataOperation = {
	type: 'cardMetadata';
	payload: StripMetadata<schema.CardMetadata>;
	timestamp: number;
};

export const cardMetadataOperationSchema = z
	.object({
		type: z.literal('cardMetadata'),
		payload: z
			.object({
				cardId: z.string(),
				noteId: z.string(),
				siblingTag: z.string(),
			})
			.passthrough(),
		timestamp: z.number(),
	})
	.passthrough() satisfies z.ZodType<CardMetadataOperation>;

export type DeckOperation = {
	type: 'deck';
	payload: StripMetadata<schema.Deck>;
	timestamp: number;
};

export const deckOperationSchema = z.object({
	type: z.literal('deck'),
	payload: z.object({
		id: z.string(),
		name: z.string(),
		deleted: z.boolean(),
		description: z.string(),
	}),
	timestamp: z.number(),
}) satisfies z.ZodType<DeckOperation>;

export type UpdateDeckCardOperation = {
	type: 'updateDeckCard';
	payload: StripMetadata<schema.CardDeck>;
	timestamp: number;
};

export const updateDeckCardOperationSchema = z.object({
	type: z.literal('updateDeckCard'),
	payload: z.object({
		deckId: z.string(),
		cardId: z.string(),
		clCount: z.number(),
	}),
	timestamp: z.number(),
}) satisfies z.ZodType<UpdateDeckCardOperation>;

export type Operation =
	| CardOperation
	| ReviewLogOperation
	| ReviewLogDeletedOperation
	| CardContentOperation
	| CardDeletedOperation
	| CardBookmarkedOperation
	| CardSuspendedOperation
	| CardMetadataOperation
	| DeckOperation
	| UpdateDeckCardOperation;

export const operationSchema = z.union([
	cardOperationSchema,
	reviewLogOperationSchema,
	reviewLogDeletedOperationSchema,
	cardContentOperationSchema,
	cardDeletedOperationSchema,
	cardBookmarkedOperationSchema,
	cardSuspendedOperationSchema,
	cardMetadataOperationSchema,
	deckOperationSchema,
	updateDeckCardOperationSchema,
]);

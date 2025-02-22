// This script is used to transform the data from the old version of spaced
// into the new version.
import dotenv from 'dotenv';
import { asc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { writeFile } from 'fs/promises';
import { ClientToServer } from '../src/client2server';
import {
	CardContentOperation,
	CardDeletedOperation,
	CardSuspendedOperation,
	DeckOperation,
	Operation,
	ReviewLogDeletedOperation,
	ReviewLogOperation,
	UpdateDeckCardOperation,
	type CardOperation,
} from '../src/operation';
import * as oldSchema from './schema-old';

dotenv.config({ path: './scripts/.env.old' });
const oldDb = drizzle(`file:${process.env.DB_PATH}`, {
	schema: oldSchema,
});

const INACTIVITY_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes in milliseconds

async function transformReviewLogs(userId: string) {
	const reviewLogs = await oldDb
		.select({
			id: oldSchema.reviewLogs.id,
			cardId: oldSchema.reviewLogs.cardId,
			grade: oldSchema.reviewLogs.grade,
			state: oldSchema.reviewLogs.state,
			due: oldSchema.reviewLogs.due,
			stability: oldSchema.reviewLogs.stability,
			difficulty: oldSchema.reviewLogs.difficulty,
			elapsed_days: oldSchema.reviewLogs.elapsed_days,
			last_elapsed_days: oldSchema.reviewLogs.last_elapsed_days,
			scheduled_days: oldSchema.reviewLogs.scheduled_days,
			review: oldSchema.reviewLogs.review,
			duration: oldSchema.reviewLogs.duration,
			createdAt: oldSchema.reviewLogs.createdAt,
			deleted: oldSchema.reviewLogs.deleted,
		})
		.from(oldSchema.cards)
		.innerJoin(oldSchema.reviewLogs, eq(oldSchema.cards.id, oldSchema.reviewLogs.cardId))
		.where(eq(oldSchema.cards.userId, userId))
		.orderBy(asc(oldSchema.reviewLogs.review));

	// Split into runs based on 2 min threshold
	const runs: (typeof reviewLogs)[] = [];
	let currentRun: typeof reviewLogs = [];

	for (let i = 0; i < reviewLogs.length; i++) {
		const current = reviewLogs[i];
		const prev = reviewLogs[i - 1];

		if (
			!prev ||
			new Date(current.review).getTime() - new Date(prev.review).getTime() > INACTIVITY_THRESHOLD_MS
		) {
			if (currentRun.length > 0) {
				runs.push(currentRun);
			}
			currentRun = [current];
		} else {
			currentRun.push(current);
		}
	}

	if (currentRun.length > 0) {
		runs.push(currentRun);
	}

	const runsOfLength1: (typeof reviewLogs)[] = runs.filter((run) => run.length === 1);
	const runsLongerThan1: (typeof reviewLogs)[] = runs.filter((run) => run.length > 1);
	const processedRuns: (typeof reviewLogs)[] = [];

	for (const run of runsLongerThan1) {
		const durations = [0];
		for (let i = 1; i < run.length; i++) {
			const current = run[i];
			const prev = run[i - 1];

			const gap = new Date(current.review).getTime() - new Date(prev.review).getTime();
			durations.push(gap);
		}

		const totalDuration = durations.reduce((a, b) => a + b, 0);
		const averageDurationWithoutFirst = Math.round(totalDuration / (durations.length - 1));
		durations[0] = averageDurationWithoutFirst;

		processedRuns.push(
			run.map((log, index) => ({
				...log,
				duration: durations[index],
			}))
		);
	}

	const flattenedProcessedRuns = processedRuns.flat();
	const globalAverageDuration =
		flattenedProcessedRuns.length > 0
			? Math.round(
					flattenedProcessedRuns.reduce((a, b) => a + b.duration, 0) / flattenedProcessedRuns.length
			  )
			: 0;

	for (const run of runsOfLength1) {
		processedRuns.push(
			run.map((log) => ({
				...log,
				duration: globalAverageDuration,
			}))
		);
	}

	return processedRuns.flat().map((log) => ({
		...log,
		duration: log.duration || globalAverageDuration,
		userId,
	}));
}

const now = new Date();

const MIGRATION_CLIENT_ID = '__spaced-migration-client_';

async function main() {
	// First dump user account info
	const userAccounts = await oldDb
		.select()
		.from(oldSchema.users)
		.innerJoin(oldSchema.accounts, eq(oldSchema.users.id, oldSchema.accounts.userId));

	const userAccountsData = userAccounts.map(({ user, account }) => ({
		email: user.email,
		providerAccountId: account.providerAccountId,
		provider: account.provider,
		imageUrl: user.image,
		displayName: user.name,
		userId: user.id,
	}));

	await writeFile(process.env.ACCOUNTS_PATH!, JSON.stringify(userAccountsData, null, 2));

	// Now process cards and operations for all users
	const cardWithContents = await oldDb
		.select()
		.from(oldSchema.cards)
		.innerJoin(oldSchema.cardContents, eq(oldSchema.cards.id, oldSchema.cardContents.cardId));

	const cardOperations = cardWithContents.map(({ cards }) => ({
		type: 'card',
		payload: {
			id: cards.id,
			userId: cards.userId,
			due: new Date(cards.due),
			stability: cards.stability,
			difficulty: cards.difficulty,
			elapsed_days: cards.elapsed_days,
			scheduled_days: cards.scheduled_days,
			reps: cards.reps,
			lapses: cards.lapses,
			state: cards.state,
			last_review: cards.last_review ? new Date(cards.last_review) : null,
		},
		timestamp: now.getTime(),
		userId: cards.userId,
		clientId: MIGRATION_CLIENT_ID + cards.userId,
	})) satisfies ClientToServer<CardOperation>[];

	const cardContentOperations = cardWithContents.map(({ cards, card_contents }) => ({
		type: 'cardContent',
		payload: {
			cardId: cards.id,
			front: card_contents.question,
			back: card_contents.answer,
		},
		timestamp: now.getTime(),
		userId: cards.userId,
		clientId: MIGRATION_CLIENT_ID + cards.userId,
	})) satisfies ClientToServer<CardContentOperation>[];

	// Only included the deleted cards that were actually deleted
	const cardDeletedOperations = cardWithContents
		.filter(({ cards }) => cards.deleted)
		.map(({ cards }) => ({
			type: 'cardDeleted',
			payload: {
				cardId: cards.id,
				userId: cards.userId,
				deleted: cards.deleted,
			},
			timestamp: now.getTime(),
			userId: cards.userId,
			clientId: MIGRATION_CLIENT_ID + cards.userId,
		})) satisfies ClientToServer<CardDeletedOperation>[];

	// Only included the suspended cards that were actually suspended before
	const DELTA = 5000;
	const cardSuspendedOperations = cardWithContents
		.filter(({ cards }) => Math.abs(cards.suspended.getTime() - cards.createdAt.getTime()) > DELTA)
		.map(({ cards }) => ({
			type: 'cardSuspended',
			payload: {
				cardId: cards.id,
				userId: cards.userId,
				suspended: cards.suspended,
			},
			timestamp: now.getTime(),
			userId: cards.userId,
			clientId: MIGRATION_CLIENT_ID + cards.userId,
		})) satisfies ClientToServer<CardSuspendedOperation>[];

	const decks = await oldDb.query.decks.findMany();

	const deckOperations = decks.map((deck) => ({
		type: 'deck',
		payload: {
			id: deck.id,
			userId: deck.userId,
			name: deck.name,
			deleted: deck.deleted,
			description: deck.description,
		},
		timestamp: now.getTime(),
		userId: deck.userId,
		clientId: MIGRATION_CLIENT_ID + deck.userId,
	})) satisfies ClientToServer<DeckOperation>[];

	const cardDecks = await oldDb
		.select()
		.from(oldSchema.cardsToDecks)
		.innerJoin(oldSchema.cards, eq(oldSchema.cardsToDecks.cardId, oldSchema.cards.id));

	const updateDeckCardOperations = cardDecks.map(({ cards, cards_to_decks }) => ({
		type: 'updateDeckCard',
		payload: {
			deckId: cards_to_decks.deckId,
			cardId: cards.id,
			userId: cards.userId,
			clCount: 1,
		},
		timestamp: now.getTime(),
		userId: cards.userId,
		clientId: MIGRATION_CLIENT_ID + cards.userId,
	})) satisfies ClientToServer<UpdateDeckCardOperation>[];

	// Get all review logs for all users
	const allReviewLogs: (typeof oldSchema.reviewLogs.$inferSelect & { userId: string })[] = [];
	for (const { user } of userAccounts) {
		const userReviewLogs = await transformReviewLogs(user.id);
		allReviewLogs.push(...userReviewLogs);
	}

	const reviewLogOperations = allReviewLogs.map((reviewLog) => ({
		type: 'reviewLog',
		payload: {
			id: reviewLog.id,
			cardId: reviewLog.cardId,

			grade: reviewLog.grade,
			state: reviewLog.state,

			due: reviewLog.due,
			stability: reviewLog.stability,
			difficulty: reviewLog.difficulty,
			elapsed_days: reviewLog.elapsed_days,
			last_elapsed_days: reviewLog.elapsed_days,
			scheduled_days: reviewLog.scheduled_days,
			review: reviewLog.review,
			duration: reviewLog.duration,

			createdAt: reviewLog.createdAt,
		},
		userId: reviewLog.userId,
		clientId: MIGRATION_CLIENT_ID + reviewLog.userId,
		timestamp: now.getTime(),
	})) satisfies ClientToServer<ReviewLogOperation>[];

	const reviewLogDeletedOperations = allReviewLogs
		.filter((reviewLog) => reviewLog.deleted)
		.map((reviewLog) => ({
			type: 'reviewLogDeleted',
			payload: {
				reviewLogId: reviewLog.id,
				userId: reviewLog.userId,
				deleted: true,
			},
			timestamp: now.getTime(),
			userId: reviewLog.userId,
			clientId: MIGRATION_CLIENT_ID + reviewLog.userId,
		})) satisfies ClientToServer<ReviewLogDeletedOperation>[];

	const allOperations: Operation[] = [
		...cardOperations,
		...cardContentOperations,
		...cardDeletedOperations,
		...cardSuspendedOperations,
		...deckOperations,
		...updateDeckCardOperations,
		...reviewLogOperations,
		...reviewLogDeletedOperations,
	];

	await writeFile(process.env.OUTPUT_PATH!, JSON.stringify(allOperations, null, 2));
}

main();

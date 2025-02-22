import { ClientToServer, handleClientOperation } from '@/client2server';
import { DB } from '@/db';
import * as schema from '@/db/schema';
import {
	CardBookmarkedOperation,
	CardContentOperation,
	CardDeletedOperation,
	CardOperation,
	CardSuspendedOperation,
	DeckOperation,
	ReviewLogDeletedOperation,
	ReviewLogOperation,
	UpdateDeckCardOperation,
} from '@/operation';
import { env } from 'cloudflare:test';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import {
	createTestUsers,
	DEFAULT_CARD_VARS,
	DEFAULT_REVIEW_LOG_VARS,
	testClientId,
	testClientId2,
	testUser,
} from 'test/integration/utils';
import { beforeEach, describe, expect, it } from 'vitest';

let db: DB;

beforeEach(async () => {
	await createTestUsers();
	db = drizzle(env.D1, {
		schema,
	});
});

const now = 100000;

const cardOp1: ClientToServer<CardOperation> = {
	type: 'card',
	userId: testUser.id,
	clientId: testClientId,
	timestamp: now,
	payload: {
		id: 'test-card-1',
		...DEFAULT_CARD_VARS,
	},
};

const cardOp2: ClientToServer<CardOperation> = {
	type: 'card',
	userId: testUser.id,
	clientId: testClientId,
	timestamp: now + 1000,
	payload: {
		id: 'test-card-1',
		...DEFAULT_CARD_VARS,
	},
};

const cardOp3: ClientToServer<CardOperation> = {
	type: 'card',
	userId: testUser.id,
	clientId: testClientId2,
	timestamp: now,
	payload: {
		id: 'test-card-1',
		...DEFAULT_CARD_VARS,
	},
};

describe('card operations', () => {
	it('should have a user', async () => {
		const user = await db.query.users.findFirst({
			where: eq(schema.users.id, testUser.id),
		});
		expect(user).toBeDefined();
		expect(user!.id).toBe(testUser.id);
	});

	it('should insert a new card', async () => {
		await handleClientOperation(cardOp1, env.D1);
		const card = await db.query.cards.findFirst({
			where: eq(schema.cards.id, cardOp1.payload.id),
		});

		expect(card).toBeDefined();
		expect(card!.id).toBe(cardOp1.payload.id);
		expect(card!.seqNo).toBe(1);
		expect(card!.lastModifiedClient).toBe(cardOp1.clientId);
		expect(Math.abs(card!.lastModified.getTime() - cardOp1.timestamp)).toBeLessThan(1000);

		const user = await db.query.users.findFirst({
			where: eq(schema.users.id, testUser.id),
			columns: {
				nextSeqNo: true,
			},
		});
		expect(user).toBeDefined();
		expect(user!.nextSeqNo).toBe(2);
	});

	it('later operation wins', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(cardOp2, env.D1);

		const card = await db.query.cards.findFirst({
			where: eq(schema.cards.id, cardOp1.payload.id),
		});
		expect(card).toBeDefined();
		expect(card!.lastModifiedClient).toBe(cardOp2.clientId);
		expect(Math.abs(card!.lastModified.getTime() - cardOp2.timestamp)).toBeLessThan(1000);
	});

	it('later operation wins even when it comes first', async () => {
		await handleClientOperation(cardOp2, env.D1);
		await handleClientOperation(cardOp1, env.D1);

		const card = await db.query.cards.findFirst({
			where: eq(schema.cards.id, cardOp1.payload.id),
		});
		expect(card).toBeDefined();
		expect(card?.seqNo).toBe(1);
		expect(card!.lastModifiedClient).toBe(cardOp2.clientId);
		expect(Math.abs(card!.lastModified.getTime() - cardOp2.timestamp)).toBeLessThan(1000);
	});

	it('when same time, the higher client id wins', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(cardOp3, env.D1);

		const card = await db.query.cards.findFirst({
			where: eq(schema.cards.id, cardOp1.payload.id),
		});

		expect(card).toBeDefined();
		expect(card!.lastModifiedClient).toBe(cardOp3.clientId);
	});
});

describe('card content operations', () => {
	const cardContentOp: ClientToServer<CardContentOperation> = {
		type: 'cardContent',
		userId: testUser.id,
		clientId: testClientId,
		timestamp: now,
		payload: {
			cardId: 'test-card-1',
			front: 'test-front',
			back: 'test-back',
		},
	};

	const cardContentOp2: ClientToServer<CardContentOperation> = {
		type: 'cardContent',
		userId: testUser.id,
		clientId: testClientId,
		timestamp: now + 100000,
		payload: {
			cardId: 'test-card-1',
			front: 'test-front-2',
			back: 'test-back-2',
		},
	};

	const cardContentOp3: ClientToServer<CardContentOperation> = {
		type: 'cardContent',
		userId: testUser.id,
		clientId: testClientId2,
		timestamp: now,
		payload: {
			cardId: 'test-card-1',
			front: 'test-front-3',
			back: 'test-back-3',
		},
	};

	it('should insert a new card content', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(cardContentOp, env.D1);

		const cardContent = await db.query.cardContents.findFirst({
			where: eq(schema.cardContents.cardId, cardContentOp.payload.cardId),
		});

		expect(cardContent).toBeDefined();
		expect(cardContent!.front).toBe(cardContentOp.payload.front);
		expect(cardContent!.back).toBe(cardContentOp.payload.back);
	});

	it('should do nothing if card content comes after card creation', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(cardContentOp, env.D1);

		const cardContent = await db.query.cardContents.findFirst({
			where: eq(schema.cardContents.cardId, cardContentOp.payload.cardId),
		});

		expect(cardContent).toBeDefined();
		expect(cardContent!.front).toBe(cardContentOp.payload.front);
		expect(cardContent!.back).toBe(cardContentOp.payload.back);
		expect(cardContent!.lastModifiedClient).toBe(cardOp1.clientId);
		expect(Math.abs(cardContent!.lastModified.getTime() - cardOp1.timestamp)).toBeLessThan(1000);
	});

	it('should not change card content if card is updated after card content', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(cardContentOp, env.D1);
		await handleClientOperation(cardOp2, env.D1);

		const cardContent = await db.query.cardContents.findFirst({
			where: eq(schema.cardContents.cardId, cardContentOp.payload.cardId),
		});

		expect(cardContent).toBeDefined();
		expect(cardContent!.front).toBe(cardContentOp.payload.front);
		expect(cardContent!.back).toBe(cardContentOp.payload.back);
		expect(cardContent!.lastModifiedClient).toBe(cardOp1.clientId);
		expect(Math.abs(cardContent!.lastModified.getTime() - cardOp1.timestamp)).toBeLessThan(1000);
	});

	it('later operation wins', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(cardContentOp, env.D1);
		await handleClientOperation(cardContentOp2, env.D1);

		const cardContent = await db.query.cardContents.findFirst({
			where: eq(schema.cardContents.cardId, cardContentOp.payload.cardId),
		});

		expect(cardContent).toBeDefined();
		expect(cardContent!.front).toBe(cardContentOp2.payload.front);
		expect(cardContent!.back).toBe(cardContentOp2.payload.back);
		expect(cardContent!.lastModifiedClient).toBe(cardContentOp2.clientId);
		expect(Math.abs(cardContent!.lastModified.getTime() - cardContentOp2.timestamp)).toBeLessThan(
			1000
		);
		expect(cardContent!.seqNo).toBe(3);
	});

	it('when same time, the higher client id wins', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(cardContentOp, env.D1);
		await handleClientOperation(cardContentOp3, env.D1);

		const cardContent = await db.query.cardContents.findFirst({
			where: eq(schema.cardContents.cardId, cardContentOp.payload.cardId),
		});

		expect(cardContent).toBeDefined();
		expect(cardContent!.front).toBe(cardContentOp3.payload.front);
		expect(cardContent!.back).toBe(cardContentOp3.payload.back);
		expect(cardContent!.lastModifiedClient).toBe(cardContentOp3.clientId);
		expect(Math.abs(cardContent!.lastModified.getTime() - cardContentOp3.timestamp)).toBeLessThan(
			1000
		);
		expect(cardContent!.seqNo).toBe(3);
	});
});

describe('card deleted operations', () => {
	const cardDeletedOp: ClientToServer<CardDeletedOperation> = {
		type: 'cardDeleted',
		userId: testUser.id,
		clientId: testClientId,
		timestamp: now,
		payload: {
			cardId: 'test-card-1',
			deleted: true,
		},
	};

	const cardDeletedOp2: ClientToServer<CardDeletedOperation> = {
		type: 'cardDeleted',
		userId: testUser.id,
		clientId: testClientId,
		timestamp: now + 100000,
		payload: {
			cardId: 'test-card-1',
			deleted: false,
		},
	};

	const cardDeletedOp3: ClientToServer<CardDeletedOperation> = {
		type: 'cardDeleted',
		userId: testUser.id,
		clientId: testClientId2,
		timestamp: now,
		payload: {
			cardId: 'test-card-1',
			deleted: false,
		},
	};

	it('should insert a new card deleted', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(cardDeletedOp, env.D1);

		const cardDeleted = await db.query.cardDeleted.findFirst({
			where: eq(schema.cardDeleted.cardId, cardDeletedOp.payload.cardId),
		});

		expect(cardDeleted).toBeDefined();
		expect(cardDeleted!.cardId).toBe(cardDeletedOp.payload.cardId);
		expect(cardDeleted!.deleted).toBe(cardDeletedOp.payload.deleted);
		expect(cardDeleted!.lastModifiedClient).toBe(cardDeletedOp.clientId);
		expect(Math.abs(cardDeleted!.lastModified.getTime() - cardDeletedOp.timestamp)).toBeLessThan(
			1000
		);
	});

	it('later operation wins', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(cardDeletedOp, env.D1);
		await handleClientOperation(cardDeletedOp2, env.D1);

		const cardDeleted = await db.query.cardDeleted.findFirst({
			where: eq(schema.cardDeleted.cardId, cardDeletedOp.payload.cardId),
		});

		expect(cardDeleted).toBeDefined();
		expect(cardDeleted!.deleted).toBe(cardDeletedOp2.payload.deleted);
		expect(cardDeleted!.lastModifiedClient).toBe(cardDeletedOp2.clientId);
		expect(Math.abs(cardDeleted!.lastModified.getTime() - cardDeletedOp2.timestamp)).toBeLessThan(
			1000
		);
		expect(cardDeleted!.seqNo).toBe(3);
	});

	it('when same time, the higher client id wins', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(cardDeletedOp, env.D1);
		await handleClientOperation(cardDeletedOp3, env.D1);

		const cardDeleted = await db.query.cardDeleted.findFirst({
			where: eq(schema.cardDeleted.cardId, cardDeletedOp.payload.cardId),
		});

		expect(cardDeleted).toBeDefined();
		expect(cardDeleted!.deleted).toBe(cardDeletedOp3.payload.deleted);
		expect(cardDeleted!.lastModifiedClient).toBe(cardDeletedOp3.clientId);
		expect(Math.abs(cardDeleted!.lastModified.getTime() - cardDeletedOp3.timestamp)).toBeLessThan(
			1000
		);
		expect(cardDeleted!.seqNo).toBe(3);
	});
});

const deckOp: ClientToServer<DeckOperation> = {
	type: 'deck',
	userId: testUser.id,
	clientId: testClientId,
	timestamp: now,
	payload: {
		id: 'test-deck-1',
		name: 'test-deck-1',
		description: 'test-deck-1',
		deleted: false,
	},
};
const deckOp2: ClientToServer<DeckOperation> = {
	type: 'deck',
	userId: testUser.id,
	clientId: testClientId,
	timestamp: now + 100000,
	payload: {
		id: 'test-deck-1',
		name: 'test-deck-2',
		description: 'test-deck-2',
		deleted: true,
	},
};

const deckOp3: ClientToServer<DeckOperation> = {
	type: 'deck',
	userId: testUser.id,
	clientId: testClientId2,
	timestamp: now,
	payload: {
		id: 'test-deck-1',
		name: 'test-deck-3',
		description: 'test-deck-3',
		deleted: false,
	},
};

describe('deck operations', () => {
	it('should insert a new deck', async () => {
		await handleClientOperation(deckOp, env.D1);
		const deck = await db.query.decks.findFirst({
			where: eq(schema.decks.id, deckOp.payload.id),
		});
		expect(deck).toBeDefined();
		expect(deck!.id).toBe(deckOp.payload.id);
		expect(deck!.name).toBe(deckOp.payload.name);
		expect(deck!.description).toBe(deckOp.payload.description);
		expect(deck!.deleted).toBe(deckOp.payload.deleted);
		expect(deck!.lastModifiedClient).toBe(deckOp.clientId);
		expect(Math.abs(deck!.lastModified.getTime() - deckOp.timestamp)).toBeLessThan(1000);
	});

	it('later operation wins', async () => {
		await handleClientOperation(deckOp, env.D1);
		await handleClientOperation(deckOp2, env.D1);

		const deck = await db.query.decks.findFirst({
			where: eq(schema.decks.id, deckOp.payload.id),
		});
		expect(deck).toBeDefined();
		expect(deck!.id).toBe(deckOp.payload.id);
		expect(deck!.name).toBe(deckOp2.payload.name);
		expect(deck!.description).toBe(deckOp2.payload.description);
		expect(deck!.deleted).toBe(deckOp2.payload.deleted);
		expect(deck!.lastModifiedClient).toBe(deckOp2.clientId);
		expect(Math.abs(deck!.lastModified.getTime() - deckOp2.timestamp)).toBeLessThan(1000);
		expect(deck!.seqNo).toBe(2);
	});

	it('when same time, the higher client id wins', async () => {
		await handleClientOperation(deckOp, env.D1);
		await handleClientOperation(deckOp3, env.D1);

		const deck = await db.query.decks.findFirst({
			where: eq(schema.decks.id, deckOp.payload.id),
		});

		expect(deck).toBeDefined();
		expect(deck!.id).toBe(deckOp.payload.id);
		expect(deck!.name).toBe(deckOp3.payload.name);
		expect(deck!.description).toBe(deckOp3.payload.description);
		expect(deck!.deleted).toBe(deckOp3.payload.deleted);
		expect(deck!.lastModifiedClient).toBe(deckOp3.clientId);
		expect(Math.abs(deck!.lastModified.getTime() - deckOp3.timestamp)).toBeLessThan(1000);
		expect(deck!.seqNo).toBe(2);
	});
});

describe('update deck card operations', () => {
	const updateDeckCardOp: ClientToServer<UpdateDeckCardOperation> = {
		type: 'updateDeckCard',
		userId: testUser.id,
		clientId: testClientId,
		timestamp: now,
		payload: {
			cardId: 'test-card-1',
			deckId: 'test-deck-1',
			clCount: 1,
		},
	};

	const updateDeckCardOp2: ClientToServer<UpdateDeckCardOperation> = {
		type: 'updateDeckCard',
		userId: testUser.id,
		clientId: testClientId,
		timestamp: now - 10000,
		payload: {
			cardId: 'test-card-1',
			deckId: 'test-deck-1',
			clCount: 2,
		},
	};

	it('should update the deck card', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(deckOp, env.D1);

		await handleClientOperation(updateDeckCardOp, env.D1);

		const cardDeck = await db.query.cardDecks.findFirst({
			where: eq(schema.cardDecks.cardId, updateDeckCardOp.payload.cardId),
		});
		expect(cardDeck).toBeDefined();
		expect(cardDeck!.clCount).toBe(updateDeckCardOp.payload.clCount);
		expect(cardDeck!.lastModifiedClient).toBe(updateDeckCardOp.clientId);
		expect(Math.abs(cardDeck!.lastModified.getTime() - updateDeckCardOp.timestamp)).toBeLessThan(
			1000
		);
	});

	it('higher clcount wins, even if it comes first', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(deckOp, env.D1);
		await handleClientOperation(updateDeckCardOp2, env.D1);
		await handleClientOperation(updateDeckCardOp, env.D1);

		const cardDeck = await db.query.cardDecks.findFirst({
			where: eq(schema.cardDecks.cardId, updateDeckCardOp.payload.cardId),
		});
		expect(cardDeck).toBeDefined();
		expect(cardDeck!.clCount).toBe(updateDeckCardOp2.payload.clCount);
		expect(cardDeck!.lastModifiedClient).toBe(updateDeckCardOp2.clientId);
		expect(Math.abs(cardDeck!.lastModified.getTime() - updateDeckCardOp2.timestamp)).toBeLessThan(
			1000
		);
		expect(cardDeck!.seqNo).toBe(3);
	});
});

describe('card bookmarked operations', () => {
	const cardBookmarkedOp: ClientToServer<CardBookmarkedOperation> = {
		type: 'cardBookmarked',
		userId: testUser.id,
		clientId: testClientId,
		timestamp: now,
		payload: {
			cardId: 'test-card-1',
			bookmarked: true,
		},
	};

	const cardBookmarkedOp2: ClientToServer<CardBookmarkedOperation> = {
		type: 'cardBookmarked',
		userId: testUser.id,
		clientId: testClientId,
		timestamp: now + 100000,
		payload: {
			cardId: 'test-card-1',
			bookmarked: false,
		},
	};

	const cardBookmarkedOp3: ClientToServer<CardBookmarkedOperation> = {
		type: 'cardBookmarked',
		userId: testUser.id,
		clientId: testClientId2,
		timestamp: now,
		payload: {
			cardId: 'test-card-1',
			bookmarked: false,
		},
	};

	it('should insert a new card bookmarked', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(cardBookmarkedOp, env.D1);

		const cardBookmarked = await db.query.cardBookmarked.findFirst({
			where: eq(schema.cardBookmarked.cardId, cardBookmarkedOp.payload.cardId),
		});

		expect(cardBookmarked).toBeDefined();
		expect(cardBookmarked!.cardId).toBe(cardBookmarkedOp.payload.cardId);
		expect(cardBookmarked!.bookmarked).toBe(cardBookmarkedOp.payload.bookmarked);
		expect(cardBookmarked!.lastModifiedClient).toBe(cardBookmarkedOp.clientId);
		expect(
			Math.abs(cardBookmarked!.lastModified.getTime() - cardBookmarkedOp.timestamp)
		).toBeLessThan(1000);
	});

	it('later operation wins', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(cardBookmarkedOp, env.D1);
		await handleClientOperation(cardBookmarkedOp2, env.D1);

		const cardBookmarked = await db.query.cardBookmarked.findFirst({
			where: eq(schema.cardBookmarked.cardId, cardBookmarkedOp.payload.cardId),
		});

		expect(cardBookmarked).toBeDefined();
		expect(cardBookmarked!.bookmarked).toBe(cardBookmarkedOp2.payload.bookmarked);
		expect(cardBookmarked!.lastModifiedClient).toBe(cardBookmarkedOp2.clientId);
		expect(
			Math.abs(cardBookmarked!.lastModified.getTime() - cardBookmarkedOp2.timestamp)
		).toBeLessThan(1000);
	});

	it('when same time, the higher client id wins', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(cardBookmarkedOp, env.D1);
		await handleClientOperation(cardBookmarkedOp3, env.D1);

		const cardBookmarked = await db.query.cardBookmarked.findFirst({
			where: eq(schema.cardBookmarked.cardId, cardBookmarkedOp.payload.cardId),
		});

		expect(cardBookmarked).toBeDefined();
		expect(cardBookmarked!.bookmarked).toBe(cardBookmarkedOp3.payload.bookmarked);
		expect(cardBookmarked!.lastModifiedClient).toBe(cardBookmarkedOp3.clientId);
		expect(
			Math.abs(cardBookmarked!.lastModified.getTime() - cardBookmarkedOp3.timestamp)
		).toBeLessThan(1000);
	});
});

describe('card suspended operations', () => {
	const cardSuspendedOp: ClientToServer<CardSuspendedOperation> = {
		type: 'cardSuspended',
		userId: testUser.id,
		clientId: testClientId,
		timestamp: now,
		payload: {
			cardId: 'test-card-1',
			suspended: new Date(now),
		},
	};

	const cardSuspendedOp2: ClientToServer<CardSuspendedOperation> = {
		type: 'cardSuspended',
		userId: testUser.id,
		clientId: testClientId,
		timestamp: now + 100000,
		payload: {
			cardId: 'test-card-1',
			suspended: new Date(now + 100000),
		},
	};

	const cardSuspendedOp3: ClientToServer<CardSuspendedOperation> = {
		type: 'cardSuspended',
		userId: testUser.id,
		clientId: testClientId2,
		timestamp: now,
		payload: {
			cardId: 'test-card-1',
			suspended: new Date(now + 200000),
		},
	};

	it('should insert a new card suspended', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(cardSuspendedOp, env.D1);

		const cardSuspended = await db.query.cardSuspended.findFirst({
			where: eq(schema.cardSuspended.cardId, cardSuspendedOp.payload.cardId),
		});

		expect(cardSuspended).toBeDefined();
		expect(cardSuspended!.cardId).toBe(cardSuspendedOp.payload.cardId);
		expect(cardSuspended!.suspended).toStrictEqual(cardSuspendedOp.payload.suspended);
		expect(cardSuspended!.lastModifiedClient).toBe(cardSuspendedOp.clientId);
		expect(
			Math.abs(cardSuspended!.lastModified.getTime() - cardSuspendedOp.timestamp)
		).toBeLessThan(1000);
	});

	it('later operation wins', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(cardSuspendedOp, env.D1);
		await handleClientOperation(cardSuspendedOp2, env.D1);

		const cardSuspended = await db.query.cardSuspended.findFirst({
			where: eq(schema.cardSuspended.cardId, cardSuspendedOp.payload.cardId),
		});

		expect(cardSuspended).toBeDefined();
		expect(cardSuspended!.suspended).toStrictEqual(cardSuspendedOp2.payload.suspended);
		expect(cardSuspended!.lastModifiedClient).toBe(cardSuspendedOp2.clientId);
		expect(
			Math.abs(cardSuspended!.lastModified.getTime() - cardSuspendedOp2.timestamp)
		).toBeLessThan(1000);
	});

	it('when same time, the higher client id wins', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(cardSuspendedOp, env.D1);
		await handleClientOperation(cardSuspendedOp3, env.D1);

		const cardSuspended = await db.query.cardSuspended.findFirst({
			where: eq(schema.cardSuspended.cardId, cardSuspendedOp.payload.cardId),
		});

		expect(cardSuspended).toBeDefined();
		expect(cardSuspended!.suspended).toStrictEqual(cardSuspendedOp3.payload.suspended);
		expect(cardSuspended!.lastModifiedClient).toBe(cardSuspendedOp3.clientId);
		expect(
			Math.abs(cardSuspended!.lastModified.getTime() - cardSuspendedOp3.timestamp)
		).toBeLessThan(1000);
	});
});

const reviewLogOp: ClientToServer<ReviewLogOperation> = {
	type: 'reviewLog',
	userId: testUser.id,
	clientId: testClientId,
	timestamp: now,
	payload: {
		id: 'test-review-log-1',
		cardId: 'test-card-1',
		...DEFAULT_REVIEW_LOG_VARS,
		createdAt: new Date(now),
	},
};
describe('review log operations', () => {
	it('should insert a new review log', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(reviewLogOp, env.D1);

		const reviewLog = await db.query.reviewLogs.findFirst({
			where: eq(schema.reviewLogs.id, reviewLogOp.payload.id),
		});

		expect(reviewLog).toBeDefined();
		expect(reviewLog!.id).toBe(reviewLogOp.payload.id);
		expect(reviewLog!.cardId).toBe(reviewLogOp.payload.cardId);
		expect(reviewLog!.createdAt).toStrictEqual(reviewLogOp.payload.createdAt);
	});

	it('operation should be idempotent', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(reviewLogOp, env.D1);
		await handleClientOperation(
			{
				...reviewLogOp,
				payload: {
					...reviewLogOp.payload,
					createdAt: new Date(now + 100000),
				},
				timestamp: now + 1000000,
			},
			env.D1
		);

		const reviewLog = await db.query.reviewLogs.findFirst({
			where: eq(schema.reviewLogs.id, reviewLogOp.payload.id),
		});

		expect(reviewLog).toBeDefined();
		expect(reviewLog!.createdAt).toStrictEqual(reviewLogOp.payload.createdAt);
	});
});

describe('review log deleted operations', () => {
	const reviewLogDeletedOp: ClientToServer<ReviewLogDeletedOperation> = {
		type: 'reviewLogDeleted',
		userId: testUser.id,
		clientId: testClientId,
		timestamp: now,
		payload: {
			reviewLogId: 'test-review-log-1',
			deleted: true,
		},
	};

	const reviewLogDeletedOp2: ClientToServer<ReviewLogDeletedOperation> = {
		type: 'reviewLogDeleted',
		userId: testUser.id,
		clientId: testClientId,
		timestamp: now + 100000,
		payload: {
			reviewLogId: 'test-review-log-1',
			deleted: false,
		},
	};

	const reviewLogDeletedOp3: ClientToServer<ReviewLogDeletedOperation> = {
		type: 'reviewLogDeleted',
		userId: testUser.id,
		clientId: testClientId2,
		timestamp: now,
		payload: {
			reviewLogId: 'test-review-log-1',
			deleted: false,
		},
	};

	it('should insert a new review log deleted', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(reviewLogOp, env.D1);
		await handleClientOperation(reviewLogDeletedOp, env.D1);

		const reviewLogDeleted = await db.query.reviewLogDeleted.findFirst({
			where: eq(schema.reviewLogDeleted.reviewLogId, reviewLogDeletedOp.payload.reviewLogId),
		});

		expect(reviewLogDeleted).toBeDefined();
		expect(reviewLogDeleted!.reviewLogId).toBe(reviewLogDeletedOp.payload.reviewLogId);
		expect(reviewLogDeleted!.deleted).toBe(reviewLogDeletedOp.payload.deleted);
	});

	it('later operation wins', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(reviewLogOp, env.D1);
		await handleClientOperation(reviewLogDeletedOp2, env.D1);

		const reviewLogDeleted = await db.query.reviewLogDeleted.findFirst({
			where: eq(schema.reviewLogDeleted.reviewLogId, reviewLogDeletedOp.payload.reviewLogId),
		});

		expect(reviewLogDeleted).toBeDefined();
		expect(reviewLogDeleted!.deleted).toBe(reviewLogDeletedOp2.payload.deleted);
	});

	it('when same time, the higher client id wins', async () => {
		await handleClientOperation(cardOp1, env.D1);
		await handleClientOperation(reviewLogOp, env.D1);
		await handleClientOperation(reviewLogDeletedOp3, env.D1);

		const reviewLogDeleted = await db.query.reviewLogDeleted.findFirst({
			where: eq(schema.reviewLogDeleted.reviewLogId, reviewLogDeletedOp.payload.reviewLogId),
		});

		expect(reviewLogDeleted).toBeDefined();
		expect(reviewLogDeleted!.deleted).toBe(reviewLogDeletedOp3.payload.deleted);
	});
});

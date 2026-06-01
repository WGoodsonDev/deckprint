import type { Deck, CardEntry } from '@/types/core';

export function makeCard(overrides: Partial<CardEntry> = {}): CardEntry {
  return {
    scryfallId: 'default-scryfall-id',
    name: 'Default Card',
    quantity: 1,
    boardType: 'mainboard',
    manaCost: '{2}',
    cmc: 2,
    colors: [],
    colorIdentity: [],
    typeLine: 'Instant',
    superTypes: [],
    cardTypes: ['Instant'],
    subTypes: [],
    setCode: 'TST',
    isCommander: false,
    isFoil: false,
    isProxy: false,
    ...overrides,
  };
}

export function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: `test-deck-${Math.random().toString(36).slice(2)}`,
    sourcePlatform: 'archidekt',
    sourceId: '1',
    sourceUrl: 'https://archidekt.com/decks/1',
    name: 'Test Deck',
    description: null,
    format: 'commander',
    colorIdentity: [],
    commanders: [],
    mainboard: [],
    sideboard: [],
    companions: [],
    cardCount: 0,
    uniqueCardCount: 0,
    includedInProfile: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

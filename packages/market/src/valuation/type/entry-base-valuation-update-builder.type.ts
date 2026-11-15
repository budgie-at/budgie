import type { EntryBaseValuationInterface } from '../interface/entry-base-valuation.interface';
import type { EntryBaseValuationUpdateInterface, MarketPricedEntryRowInterface } from '@budgie/contracts';

export type EntryBaseValuationUpdateBuilderType = (
    row: MarketPricedEntryRowInterface,
    valuation: EntryBaseValuationInterface
) => EntryBaseValuationUpdateInterface | null;

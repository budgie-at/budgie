import type * as Schema from 'effect/Schema';

export interface BinanceCapitalHistorySourceInterface<T> {
    readonly endpoint: string;
    readonly schema: Schema.ConstraintDecoder<readonly T[]>;
    readonly cache: Map<string, readonly T[]>;
}

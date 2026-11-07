import * as Effect from 'effect/Effect';

import { consolidateInzhur } from './consolidate-inzhur';
import { importInzhurBankTransaction } from './import-inzhur-bank-transaction';

export const importInzhurBankFlow = Effect.fnUntraced(function* (...parameters: Parameters<typeof importInzhurBankTransaction>) {
    yield* importInzhurBankTransaction(...parameters);
    yield* consolidateInzhur;
});

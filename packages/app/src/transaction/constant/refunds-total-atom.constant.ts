import { TransactionEntryTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { appAtomRuntime } from '../../@generic/runtime/app.runtime';

import type { LanguageEnum } from '@budgie/contracts';

export const refundsTotalAtom = Atom.family(([transactionId, language]: readonly [number | null, LanguageEnum]) =>
    appAtomRuntime.atom(
        isDefined(transactionId)
            ? transactionRepository.findConsolidationSources(transactionId, language).pipe(
                  Effect.map(sources =>
                      sources
                          .filter(source => source.entryType === TransactionEntryTypeEnum.DEBIT)
                          .reduce((sum, source) => sum + source.amount, 0)
                  ),
                  Effect.tapCause(Effect.logError)
              )
            : Effect.succeed(null)
    )
);

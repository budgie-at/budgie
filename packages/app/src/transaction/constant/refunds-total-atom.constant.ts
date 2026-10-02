import { TransactionEntryTypeEnum, TransactionConsolidationRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined } from '@rnw-community/shared';

import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

import { TRANSACTION_LIST_TABLES } from './transaction-list-tables.constant';

import type { LanguageEnum } from '@budgie/contracts';

export const refundsTotalAtom = Atom.family(([transactionId, language]: readonly [number | null, LanguageEnum]) =>
    databaseQueryAtom(
        TRANSACTION_LIST_TABLES,
        isDefined(transactionId)
            ? Effect.flatMap(TransactionConsolidationRepository, transactionConsolidationRepository =>
                  transactionConsolidationRepository.findConsolidationSources(transactionId, language)
              ).pipe(
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

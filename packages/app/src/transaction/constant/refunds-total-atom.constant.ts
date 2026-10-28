import {
    AccountEntityTable,
    CategoryEntityTable,
    DefaultCategoryTranslationEntityTable,
    InstrumentEntityTable,
    MccCategoryEntityTable,
    TransactionConsolidationRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined } from '@rnw-community/shared';

import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

import type { LanguageEnum } from '@budgie/contracts';

export const refundsTotalAtom = Atom.family(([transactionId, language]: readonly [number | null, LanguageEnum]) =>
    databaseQueryAtom(
        [
            TransactionEntryEntityTable,
            TransactionEntityTable,
            AccountEntityTable,
            InstrumentEntityTable,
            CategoryEntityTable,
            DefaultCategoryTranslationEntityTable,
            MccCategoryEntityTable
        ],
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

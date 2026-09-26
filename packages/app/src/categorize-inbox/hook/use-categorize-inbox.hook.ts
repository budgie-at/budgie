import { isDefined } from '@rnw-community/shared';

import { transactionCategorizeInboxRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useSettingsContext } from '../../settings/context/settings.context';
import { buildTransactionFilterKey } from '../../transaction/utils/build-transaction-filter-key.util';
import { categorizeInboxEngineService } from '../service/categorize-inbox-engine.service';

import type { UseCategorizeInboxReturnInterface } from '../interface/use-categorize-inbox-return.interface';
import type { TransactionFilterInterface } from '@budgie/contracts';

export const useCategorizeInbox = (filters: TransactionFilterInterface): UseCategorizeInboxReturnInterface => {
    const { defaultInstrument } = useSettingsContext();

    const { data: rows, updatedAt: rowsUpdatedAt } = useDatabaseLiveQuery(
        transactionCategorizeInboxRepository.findUncategorizedRows(filters),
        [buildTransactionFilterKey(filters)]
    );
    const { data: evidence, updatedAt: evidenceUpdatedAt } = useDatabaseLiveQuery(
        transactionCategorizeInboxRepository.findLabeledEvidence()
    );

    return {
        inbox: categorizeInboxEngineService.buildInbox(rows, evidence, defaultInstrument.id),
        isLoading: !isDefined(rowsUpdatedAt) || !isDefined(evidenceUpdatedAt)
    };
};

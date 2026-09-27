import { isDefined } from '@rnw-community/shared';

import { transactionCategorizeInboxRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useSettingsContext } from '../../settings/context/settings.context';
import { buildTransactionFilterKey } from '../../transaction/utils/build-transaction-filter-key.util';
import { categorizeInboxEngineService } from '../service/categorize-inbox-engine.service';

import type { CategorizeInboxDataInterface } from '../interface/categorize-inbox-data.interface';
import type { TransactionFilterInterface } from '@budgie/contracts';

export const useCategorizeInbox = (filters: TransactionFilterInterface): CategorizeInboxDataInterface => {
    const { defaultInstrument } = useSettingsContext();

    const { data: rows, updatedAt: rowsUpdatedAt } = useDatabaseLiveQuery(
        transactionCategorizeInboxRepository.findUncategorizedRows(filters),
        [buildTransactionFilterKey(filters)]
    );
    const { data: evidence, updatedAt: evidenceUpdatedAt } = useDatabaseLiveQuery(
        transactionCategorizeInboxRepository.findLabeledEvidence()
    );

    return {
        rows,
        context: categorizeInboxEngineService.buildContext(evidence, defaultInstrument.id),
        isLoading: !isDefined(rowsUpdatedAt) || !isDefined(evidenceUpdatedAt)
    };
};

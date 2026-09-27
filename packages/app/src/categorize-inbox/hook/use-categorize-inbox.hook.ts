import { isDefined } from '@rnw-community/shared';

import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useSettingsContext } from '../../settings/context/settings.context';
import { buildTransactionFilterKey } from '../../transaction/utils/build-transaction-filter-key.util';
import { useCategorizeInboxStrategy } from '../context/categorize-inbox-strategy.context';
import { categorizeInboxEngineService } from '../service/categorize-inbox-engine.service';

import type { CategorizeInboxDataInterface } from '../interface/categorize-inbox-data.interface';
import type { TransactionFilterInterface } from '@budgie/contracts';

export const useCategorizeInbox = (filters: TransactionFilterInterface): CategorizeInboxDataInterface => {
    const { defaultInstrument } = useSettingsContext();
    const { findRows, findEvidence } = useCategorizeInboxStrategy();

    const { data: rows, updatedAt: rowsUpdatedAt } = useDatabaseLiveQuery(findRows(filters), [buildTransactionFilterKey(filters)]);
    const { data: evidence, updatedAt: evidenceUpdatedAt } = useDatabaseLiveQuery(findEvidence());

    return {
        rows,
        context: categorizeInboxEngineService.buildContext(evidence, defaultInstrument.id),
        isLoading: !isDefined(rowsUpdatedAt) || !isDefined(evidenceUpdatedAt)
    };
};

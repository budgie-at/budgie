import { t } from '@lingui/core/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { getEnableBankingTransactionDisplayTitle } from './get-enable-banking-transaction-display-title.util';

import type { ConsolidationSourceRowInterface } from '@budgie/contracts';

export const getConsolidationSourceTitle = (
    source: Pick<ConsolidationSourceRowInterface, 'sourceTitle' | 'sourceComment' | 'sourceExternalSource'>
): string => {
    const title = getEnableBankingTransactionDisplayTitle({
        title: source.sourceTitle,
        comment: source.sourceComment,
        externalSource: source.sourceExternalSource
    });

    return isNotEmptyString(title) ? title : t`Original transaction`;
};

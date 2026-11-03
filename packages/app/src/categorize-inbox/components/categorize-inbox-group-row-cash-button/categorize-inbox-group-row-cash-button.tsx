import { useLingui } from '@lingui/react/macro';

import { isEmptyArray } from '@rnw-community/shared';

import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxGroupRowActionButton } from '../categorize-inbox-group-row-action-button/categorize-inbox-group-row-action-button';
import { CategorizeInboxGroupRowSelector } from '../categorize-inbox-group-row/categorize-inbox-group-row.selector';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupRowCashButton = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { includedRows, moveToCash, cashWithdrawalTransactionIds } = useCategorizeInboxContext();

    const { key, displayTitle } = cluster;
    const transactionIds = includedRows(cluster)
        .map(row => row.transactionId)
        .filter(transactionId => cashWithdrawalTransactionIds.has(transactionId));

    const handlePress = (): void => {
        moveToCash(transactionIds);
    };

    return (
        <CategorizeInboxGroupRowActionButton
            title={t`To cash`}
            label={t`Move ${displayTitle} to cash`}
            isDisabled={isEmptyArray(transactionIds)}
            onPress={handlePress}
            {...testID(CategorizeInboxGroupRowSelector.MoveToCashButton, key)}
        />
    );
};

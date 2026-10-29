import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxGroupRowPill } from '../categorize-inbox-group-row-pill/categorize-inbox-group-row-pill';
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
        <CategorizeInboxGroupRowPill
            className="bg-warning-background"
            label={t`Move ${displayTitle} to cash`}
            isDisabled={isEmptyArray(transactionIds)}
            onPress={handlePress}
            {...testID(CategorizeInboxGroupRowSelector.MoveToCashButton, key)}
        >
            <Text className="text-xs font-medium text-warning-foreground">{t`Move to cash`}</Text>
        </CategorizeInboxGroupRowPill>
    );
};

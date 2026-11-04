import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';

export const BankIntegrationEmptyAccounts = () => (
    <GroupedListRow
        testID={BankIntegrationSelector.EmptyState}
        title={
            <Text className="text-secondary-foreground text-[15px]">
                <Trans>No accounts yet</Trans>
            </Text>
        }
    />
);

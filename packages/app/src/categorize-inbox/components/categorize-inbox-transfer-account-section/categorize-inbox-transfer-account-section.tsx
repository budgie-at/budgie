import { View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { CategorizeInboxTransferAccountRow } from '../categorize-inbox-transfer-account-row/categorize-inbox-transfer-account-row';

import type { AccountWithInstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly accounts: readonly AccountWithInstrumentEntityInterface[];
    readonly onSelect: (account: AccountWithInstrumentEntityInterface) => void;
}

export const CategorizeInboxTransferAccountSection = ({ title, accounts, onSelect }: Props) => (
    <View className="pt-3xl">
        <GroupedListSection title={title}>
            {accounts.map(account => (
                <CategorizeInboxTransferAccountRow key={account.id} account={account} onSelect={onSelect} />
            ))}
        </GroupedListSection>
    </View>
);

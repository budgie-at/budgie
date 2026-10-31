import { Text, View } from 'react-native';

import { CategorizeInboxTransferAccountRow } from '../categorize-inbox-transfer-account-row/categorize-inbox-transfer-account-row';

import type { AccountWithInstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly accounts: readonly AccountWithInstrumentEntityInterface[];
    readonly onSelect: (account: AccountWithInstrumentEntityInterface) => void;
}

export const CategorizeInboxTransferAccountSection = ({ title, accounts, onSelect }: Props) => (
    <View className="pt-xl">
        <Text className="text-secondary-foreground pb-md text-sm">{title}</Text>
        {accounts.map(account => (
            <CategorizeInboxTransferAccountRow key={account.id} account={account} onSelect={onSelect} />
        ))}
    </View>
);

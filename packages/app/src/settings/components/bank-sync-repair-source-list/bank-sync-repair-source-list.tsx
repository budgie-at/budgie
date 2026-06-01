import { View } from 'react-native';

import { BankSyncRepairSourceRow } from '../bank-sync-repair-source-row/bank-sync-repair-source-row';

import type { BankSyncRepairSourceListPropsInterface } from './bank-sync-repair-source-list-props.interface';

export const BankSyncRepairSourceList = ({ isVisible, sources }: BankSyncRepairSourceListPropsInterface) => {
    if (!isVisible) {
        return null;
    }

    return (
        <View className="gap-y-lg">
            {sources.map(source => (
                <BankSyncRepairSourceRow key={source.externalSource} {...source} />
            ))}
        </View>
    );
};

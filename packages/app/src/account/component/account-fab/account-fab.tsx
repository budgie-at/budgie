import { View } from 'react-native';

import { CreateTransactionTrigger } from '../../../transaction/components/create-transaction-trigger/create-transaction-trigger';

import type { Ref } from 'react';

interface Props {
    readonly isMenuOpen: boolean;
    readonly onPress: () => void;
    readonly ref?: Ref<View>;
}

export const AccountFab = ({ isMenuOpen, onPress, ref }: Props) => (
    <View className="absolute right-0 bottom-0 px-lg pb-safe-or-[12px]" pointerEvents="box-none">
        <CreateTransactionTrigger ref={ref} isOpen={isMenuOpen} onPress={onPress} />
    </View>
);

import { View } from 'react-native';

import { CreateTransactionTrigger } from '../../../transaction/components/create-transaction-trigger/create-transaction-trigger';

interface Props {
    readonly isMenuOpen: boolean;
    readonly onPress: () => void;
}

export const AccountFab = ({ isMenuOpen, onPress }: Props) => (
    <View className="absolute right-0 bottom-0 px-lg pb-safe" pointerEvents="box-none">
        <CreateTransactionTrigger isOpen={isMenuOpen} onPress={onPress} />
    </View>
);

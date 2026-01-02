import { UserIconNameEnum } from '@budgie/contracts';
import { useRef } from 'react';
import { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateTransactionBottomSheet } from '../../../transaction/components/create-transaction-bottom-sheet/create-transaction-bottom-sheet';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly accountId: number;
}

export const FloatingAddButton = ({ accountId }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { bottom } = useSafeAreaInsets();

    const handleOpen = () => void ref.current?.open();

    const style: ViewStyle = { bottom: bottom + 24, right: 24 };

    return (
        <>
            <HapticPressable onPress={handleOpen} className="absolute shadow-lg rounded-full" style={style}>
                <CircleIcon icon={UserIconNameEnum.Plus} variant="primary" size={56} iconSize={28} radius={28} border={false} />
            </HapticPressable>

            <CreateTransactionBottomSheet ref={ref} accountId={accountId} />
        </>
    );
};

import { UserIconNameEnum } from '@budgie/contracts';
import { useRef } from 'react';
import { View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { CreateTransactionBottomSheet } from '../create-transaction-bottom-sheet/create-transaction-bottom-sheet';

export const CreateTransactionTabButton = () => {
    const ref = useRef<BottomSheetInterface | null>(null);

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <View>
                <HapticPressable
                    className="bg-primary p-7xl rounded-full mb-sm -translate-y-10 w-19 h-19 items-center justify-center"
                    onPress={handleOpen}
                >
                    <Icon className="text-primary-reverse" icon={UserIconNameEnum.Plus} size={24} />
                </HapticPressable>
            </View>

            <CreateTransactionBottomSheet ref={ref} />
        </>
    );
};

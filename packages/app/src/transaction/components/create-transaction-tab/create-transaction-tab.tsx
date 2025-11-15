import { useRef } from 'react';

import { TabButton } from '../../../@generic/components/tab-button/tab-button';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { CreateTransactionBottomSheet } from '../create-transaction-bottom-sheet/create-transaction-bottom-sheet';

import type { BottomSheetModal } from '@gorhom/bottom-sheet';


export const CreateTransactionTab = () => {
    const ref = useRef<BottomSheetModal>(null);

    const handleOpen = () => void ref.current?.present();

    return (
        <>
            <TabButton icon={ICONS.Plus} onPress={handleOpen} />

            <CreateTransactionBottomSheet ref={ref} />
        </>
    );
};

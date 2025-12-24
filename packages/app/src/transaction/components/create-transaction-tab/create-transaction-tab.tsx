import { useRef } from 'react';

import { TabButton } from '../../../@generic/component/tab-button/tab-button';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { CreateTransactionBottomSheet } from '../create-transaction-bottom-sheet/create-transaction-bottom-sheet';

export const CreateTransactionTab = () => {
    const ref = useRef<BottomSheetInterface | null>(null);

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <TabButton icon={ICONS.Plus} onPress={handleOpen} />

            <CreateTransactionBottomSheet ref={ref} />
        </>
    );
};

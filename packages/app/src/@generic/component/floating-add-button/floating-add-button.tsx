import { RefObject, useCallback } from 'react';

import { CreateTransactionBottomSheet } from '../../../transaction/components/create-transaction-bottom-sheet/create-transaction-bottom-sheet';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { FloatingActionButton } from '../floating-action-button/floating-action-button';

interface Props {
    readonly accountId: number;
}

export const FloatingAddButton = ({ accountId }: Props) => {
    const renderBottomSheet = useCallback(
        (ref: RefObject<BottomSheetInterface | null>) => <CreateTransactionBottomSheet ref={ref} accountId={accountId} />,
        [accountId]
    );

    return <FloatingActionButton renderBottomSheet={renderBottomSheet} />;
};

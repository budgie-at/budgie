import { createContext, useRef } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { CreateTransactionBottomSheet } from '../components/create-transaction-bottom-sheet/create-transaction-bottom-sheet';

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { EmptyFn } from '@rnw-community/shared';
import type { PropsWithChildren } from 'react';

interface CreateTransactionBottomSheetContextInterface {
    open: EmptyFn;
    close: EmptyFn;
}

export const CreateTransactionBottomSheetContext = createContext<CreateTransactionBottomSheetContextInterface>({
    open: emptyFn,
    close: emptyFn
});

const CreateTransactionBottomSheetProvider = ({ children }: PropsWithChildren) => {
    const ref = useRef<BottomSheetModal>(null);

    const open = () => void ref.current?.present();
    const close = () => void ref.current?.collapse();

    return (
        <CreateTransactionBottomSheetContext.Provider value={{ open, close }}>
            {children}

            <CreateTransactionBottomSheet ref={ref} />
        </CreateTransactionBottomSheetContext.Provider>
    );
};
export default CreateTransactionBottomSheetProvider;

import { createContext, useRef } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { CreateAccountBottomSheet } from '../components/create-account-bottom-sheet/create-account-bottom-sheet';

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { EmptyFn } from '@rnw-community/shared';
import type { PropsWithChildren } from 'react';

interface CreateAccountBottomSheetContextInterface {
    open: EmptyFn;
    close: EmptyFn;
}

export const CreateAccountBottomSheetContext = createContext<CreateAccountBottomSheetContextInterface>({
    open: emptyFn,
    close: emptyFn
});

const CreateAccountBottomSheetProvider = ({ children }: PropsWithChildren) => {
    const ref = useRef<BottomSheetModal>(null);

    const open = () => void ref.current?.present();
    const close = () => void ref.current?.collapse();

    return (
        <CreateAccountBottomSheetContext.Provider value={{ open, close }}>
            {children}

            <CreateAccountBottomSheet ref={ref} />
        </CreateAccountBottomSheetContext.Provider>
    );
};
export default CreateAccountBottomSheetProvider;

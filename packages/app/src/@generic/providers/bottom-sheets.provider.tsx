import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import CreateTransactionBottomSheetProvider from '../../@account/provider/create-transaction-bottom-sheet.provider';

import type { PropsWithChildren } from 'react';

export const BottomSheetsProvider = ({ children }: PropsWithChildren) => (
    <GestureHandlerRootView>
        <BottomSheetModalProvider>
            <CreateTransactionBottomSheetProvider>{children}</CreateTransactionBottomSheetProvider>
        </BottomSheetModalProvider>
    </GestureHandlerRootView>
);

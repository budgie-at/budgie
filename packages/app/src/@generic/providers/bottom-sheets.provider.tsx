import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import CreateAccountBottomSheetProvider from '../../@account/provider/create-account-bottom-sheet.provider';

import type { PropsWithChildren } from 'react';

export const BottomSheetsProvider = ({ children }: PropsWithChildren) => (
    <GestureHandlerRootView>
        <BottomSheetModalProvider>
            <CreateAccountBottomSheetProvider>{children}</CreateAccountBottomSheetProvider>
        </BottomSheetModalProvider>
    </GestureHandlerRootView>
);

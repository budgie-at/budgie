import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import type { PropsWithChildren } from 'react';

export const BottomSheetsProvider = ({ children }: PropsWithChildren) => (
    <GestureHandlerRootView className="flex-1">
        <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
    </GestureHandlerRootView>
);

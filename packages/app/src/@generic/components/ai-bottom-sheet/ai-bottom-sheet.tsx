import BottomSheet, { BottomSheetModalProvider, BottomSheetView } from '@gorhom/bottom-sheet';
import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useRef } from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../../../theme/context/theme.context';

interface AiBottomSheetContextInterface {
    open: () => void;
    close: () => void;
}

// eslint-disable-next-line no-empty-function
const AiBottomSheetContext = createContext<AiBottomSheetContextInterface>({ open: () => {}, close: () => {} });

export const useAiBottomSheetContext = () => useContext(AiBottomSheetContext);

export const AiBottomSheetProvider = ({ children }: PropsWithChildren) => {
    const bottomSheetModalRef = useRef<BottomSheet>(null);
    const { theme } = useContext(ThemeContext);

    const open = useCallback(() => {
        bottomSheetModalRef.current?.expand();
    }, []);

    const close = useCallback(() => {
        bottomSheetModalRef.current?.close();
    }, []);

    const handleSheetChanges = useCallback((index: number) => {
        console.log('handleSheetChanges', index);
    }, []);

    return (
        <AiBottomSheetContext value={{ close, open }}>
            <BottomSheetModalProvider>
                {children}

                <BottomSheet
                    enablePanDownToClose
                    index={-1}
                    onChange={handleSheetChanges}
                    ref={bottomSheetModalRef}
                    snapPoints={['75%']}
                    style={{
                        shadowColor: theme.colors.black,
                        shadowOffset: {
                            width: 0,
                            height: 5
                        },
                        shadowOpacity: 0.36,
                        shadowRadius: 6.68,

                        elevation: 11
                    }}
                >
                    <BottomSheetView
                        style={{
                            flex: 1
                        }}
                    >
                        <SafeAreaView>
                            <Text onPress={close}>Awesome 🎉</Text>
                        </SafeAreaView>
                    </BottomSheetView>
                </BottomSheet>
            </BottomSheetModalProvider>
        </AiBottomSheetContext>
    );
};

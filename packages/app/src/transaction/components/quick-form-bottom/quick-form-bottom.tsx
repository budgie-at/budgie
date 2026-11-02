import { ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { getTransactionKeypadLayout } from '../../utils/get-transaction-keypad-layout.util';

const CONTROLS_MIN_HEIGHT = 241;

interface Props {
    readonly children: ReactNode;
}

export const QuickFormBottom = ({ children }: Props) => {
    const { fontScale } = useWindowDimensions();
    const bottomStyle = {
        minHeight: CONTROLS_MIN_HEIGHT + 18 * (fontScale - 1) + getTransactionKeypadLayout(fontScale).keypadStyle.minHeight
    };

    return (
        <View className="flex-1 justify-end" style={bottomStyle}>
            {children}
        </View>
    );
};

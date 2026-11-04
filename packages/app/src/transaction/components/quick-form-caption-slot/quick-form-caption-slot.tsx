import { ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';

interface Props {
    readonly children?: ReactNode;
}

export const QuickFormCaptionSlot = ({ children }: Props) => {
    const captionStyle = { minHeight: 40 * useWindowDimensions().fontScale };

    return (
        <View className="items-center justify-center self-stretch px-xl" style={captionStyle} accessibilityLiveRegion="polite">
            {children}
        </View>
    );
};

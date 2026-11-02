import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { BottomChromeInsetProvider, ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';

import { useQuickFormLayout } from '../../hook/use-quick-form-layout.hook';

interface Props {
    readonly hero: ReactNode;
    readonly children: ReactNode;
    readonly footer: ReactNode;
}

const HIDDEN_EDGE_FADE_PROPS = { style: { display: 'none' } } as const;

export const QuickFormLayout = ({ hero, children, footer }: Props) => {
    const {
        handleLayout,
        handleHeroLayout,
        handleFieldsLayout,
        overflows,
        bottomPadding,
        footerStyle,
        contentStyle,
        keypadContainerStyle
    } = useQuickFormLayout();
    const upperContent = (
        <View className="grow" style={contentStyle}>
            <View className="grow justify-center py-[16px]">
                <View onLayout={handleHeroLayout}>{hero}</View>
            </View>
            <View onLayout={handleFieldsLayout}>{children}</View>
        </View>
    );

    return (
        <BottomChromeInsetProvider>
            <View className="flex-1" onLayout={handleLayout}>
                {overflows ? (
                    <ScrollView className="flex-1" bounces={false} showsVerticalScrollIndicator={false}>
                        {upperContent}
                    </ScrollView>
                ) : (
                    <View className="flex-1">{upperContent}</View>
                )}
                <View className="h-[12px]" />
                <View style={footerStyle}>
                    <ScreenChromeFooter includeBottomSafeArea={false} edgeFadeProps={HIDDEN_EDGE_FADE_PROPS} bottomOffset={bottomPadding}>
                        <View style={keypadContainerStyle}>{footer}</View>
                    </ScreenChromeFooter>
                </View>
            </View>
        </BottomChromeInsetProvider>
    );
};

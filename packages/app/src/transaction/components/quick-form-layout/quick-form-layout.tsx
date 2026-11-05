import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { BottomChromeInsetProvider, ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';

import { QuickFormHeroAlignmentEnum } from '../../enum/quick-form-hero-alignment.enum';
import { useQuickFormLayout } from '../../hook/use-quick-form-layout.hook';

interface Props {
    readonly hero: ReactNode;
    readonly children?: ReactNode;
    readonly footer: ReactNode;
    readonly heroAlignment?: QuickFormHeroAlignmentEnum;
}

const heroContainerVariants = cva('grow pb-[28px]', {
    variants: {
        heroAlignment: {
            [QuickFormHeroAlignmentEnum.START]: 'justify-start pt-[28px]',
            [QuickFormHeroAlignmentEnum.END]: 'justify-end pt-[16px]'
        }
    }
});

const HIDDEN_EDGE_FADE_PROPS = { style: { display: 'none' } } as const;

export const QuickFormLayout = ({ hero, children, footer, heroAlignment = QuickFormHeroAlignmentEnum.END }: Props) => {
    const {
        requiresScrolling,
        handleLayout,
        handleHeroLayout,
        handleFieldsLayout,
        overflows,
        bottomPadding,
        footerStyle,
        contentStyle,
        keypadContainerStyle
    } = useQuickFormLayout();

    const footerContent = (
        <View>
            <View className="h-[12px] shrink-0" />
            <View style={footerStyle}>
                <ScreenChromeFooter includeBottomSafeArea={false} edgeFadeProps={HIDDEN_EDGE_FADE_PROPS} bottomOffset={bottomPadding}>
                    <View style={keypadContainerStyle}>{footer}</View>
                </ScreenChromeFooter>
            </View>
        </View>
    );
    const scrollEnabled = requiresScrolling || overflows;

    return (
        <BottomChromeInsetProvider>
            <View className="flex-1" onLayout={handleLayout}>
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={contentStyle}
                    scrollEnabled={scrollEnabled}
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    contentInsetAdjustmentBehavior="never"
                    automaticallyAdjustContentInsets={false}
                >
                    <View className={heroContainerVariants({ heroAlignment })}>
                        <View onLayout={handleHeroLayout}>{hero}</View>
                    </View>
                    <View onLayout={handleFieldsLayout}>{children}</View>
                    {requiresScrolling ? footerContent : null}
                </ScrollView>
                {requiresScrolling ? null : footerContent}
            </View>
        </BottomChromeInsetProvider>
    );
};

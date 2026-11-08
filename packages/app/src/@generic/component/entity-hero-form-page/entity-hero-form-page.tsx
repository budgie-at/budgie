import { useState } from 'react';
import { View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { ScreenChromeFrame, ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';

import { ScreenChromeThemeProvider } from '../../provider/screen-chrome-theme.provider';
import { EntityFormBackButton } from '../entity-form-back-button/entity-form-back-button';
import { EntityFormFooter } from '../entity-form-footer/entity-form-footer';
import { EntityFormSubmitButton } from '../entity-form-submit-button/entity-form-submit-button';
import { FixedChromeScroll } from '../fixed-chrome-scroll/fixed-chrome-scroll';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly onCancel: () => void;
    readonly submitLabel: string;
    readonly isReady: boolean;
    readonly isLoading: boolean;
    readonly isDisabled: boolean;
    readonly onSubmit: () => void;
    readonly submitTestID: string;
    readonly children: ReactNode;
}

export const EntityHeroFormPage = (props: Props) => {
    const { onCancel, submitLabel, isReady, isLoading, isDisabled, onSubmit, submitTestID, children } = props;
    const headerStyle = useResolveClassNames('bg-sheet-surface');
    const [footerHeight, setFooterHeight] = useState(0);
    const handleFooterLayout = (event: LayoutChangeEvent) => {
        setFooterHeight(event.nativeEvent.layout.height);
    };

    return (
        <View className="bg-sheet-surface flex-1">
            <ScreenChromeThemeProvider>
                <ScreenChromeFrame>
                    <FixedChromeScroll footerHeight={footerHeight}>{children}</FixedChromeScroll>
                    <ScreenChromeHeader style={headerStyle}>
                        <EntityFormBackButton onPress={onCancel} />
                    </ScreenChromeHeader>
                    <EntityFormFooter onLayout={handleFooterLayout}>
                        <EntityFormSubmitButton
                            label={submitLabel}
                            isReady={isReady}
                            isLoading={isLoading}
                            isDisabled={isDisabled}
                            onPress={onSubmit}
                            testID={submitTestID}
                        />
                    </EntityFormFooter>
                </ScreenChromeFrame>
            </ScreenChromeThemeProvider>
        </View>
    );
};

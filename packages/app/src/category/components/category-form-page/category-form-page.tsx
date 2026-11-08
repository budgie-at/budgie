import { useState } from 'react';
import { useResolveClassNames } from 'uniwind';

import { ScreenChromeFrame, ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';

import { FixedChromeScroll } from '../../../@generic/component/fixed-chrome-scroll/fixed-chrome-scroll';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { CategoryFormBackButton } from '../category-form-back-button/category-form-back-button';
import { CategoryFormFooter } from '../category-form-footer/category-form-footer';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly onCancel: () => void;
    readonly footer: ReactNode;
    readonly children: ReactNode;
}

export const CategoryFormPage = ({ onCancel, footer, children }: Props) => {
    const headerStyle = useResolveClassNames('bg-sheet-surface');
    const [footerHeight, setFooterHeight] = useState(0);
    const handleFooterLayout = (event: LayoutChangeEvent) => {
        setFooterHeight(event.nativeEvent.layout.height);
    };

    return (
        <ScreenChromeThemeProvider>
            <ScreenChromeFrame>
                <FixedChromeScroll footerHeight={footerHeight}>{children}</FixedChromeScroll>
                <ScreenChromeHeader style={headerStyle}>
                    <CategoryFormBackButton onPress={onCancel} />
                </ScreenChromeHeader>
                <CategoryFormFooter onLayout={handleFooterLayout}>{footer}</CategoryFormFooter>
            </ScreenChromeFrame>
        </ScreenChromeThemeProvider>
    );
};

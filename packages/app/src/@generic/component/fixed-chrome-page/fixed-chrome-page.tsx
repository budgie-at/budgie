import { useState } from 'react';

import { BottomChromeInsetProvider, ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { ScreenChromeThemeProvider } from '../../provider/screen-chrome-theme.provider';
import { FixedChromeHeader } from '../fixed-chrome-header/fixed-chrome-header';
import { FixedChromeScroll } from '../fixed-chrome-scroll/fixed-chrome-scroll';
import { StickyFooterBand } from '../sticky-footer-band/sticky-footer-band';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly title: string;
    readonly leading?: ReactNode;
    readonly footer?: ReactNode;
    readonly children: ReactNode;
    readonly testID?: string;
}

export const FixedChromePage = ({ title, leading, footer, children, testID }: Props) => {
    const [footerHeight, setFooterHeight] = useState(0);
    const handleFooterLayout = (event: LayoutChangeEvent) => {
        setFooterHeight(event.nativeEvent.layout.height);
    };

    return (
        <ScreenChromeThemeProvider>
            <BottomChromeInsetProvider>
                <ScreenChromeFrame>
                    <FixedChromeScroll footerHeight={footerHeight} testID={testID}>
                        {children}
                    </FixedChromeScroll>
                    <FixedChromeHeader title={title} leading={leading} />
                    {isDefined(footer) ? <StickyFooterBand onLayout={handleFooterLayout}>{footer}</StickyFooterBand> : null}
                </ScreenChromeFrame>
            </BottomChromeInsetProvider>
        </ScreenChromeThemeProvider>
    );
};

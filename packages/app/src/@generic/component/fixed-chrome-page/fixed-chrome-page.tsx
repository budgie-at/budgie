import { BottomChromeInsetProvider, ScreenChromeFooter, ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { ScreenChromeThemeProvider } from '../../provider/screen-chrome-theme.provider';
import { FixedChromeHeader } from '../fixed-chrome-header/fixed-chrome-header';
import { FixedChromeScroll } from '../fixed-chrome-scroll/fixed-chrome-scroll';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly leading?: ReactNode;
    readonly footer?: ReactNode;
    readonly children: ReactNode;
    readonly testID?: string;
}

export const FixedChromePage = ({ title, leading, footer, children, testID }: Props) => (
    <ScreenChromeThemeProvider>
        <BottomChromeInsetProvider>
            <ScreenChromeFrame>
                <FixedChromeScroll testID={testID}>{children}</FixedChromeScroll>
                <FixedChromeHeader title={title} leading={leading} />
                {isDefined(footer) ? <ScreenChromeFooter>{footer}</ScreenChromeFooter> : null}
            </ScreenChromeFrame>
        </BottomChromeInsetProvider>
    </ScreenChromeThemeProvider>
);

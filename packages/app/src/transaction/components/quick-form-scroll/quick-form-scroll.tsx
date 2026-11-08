import { use } from 'react';

import { useBottomChromeInset } from '@rnw-community/react-native-screen-chrome';
import { isPositiveNumber } from '@rnw-community/shared';

import { ChromeKeyboardScrollView } from '../../../@generic/component/chrome-keyboard-scroll-view/chrome-keyboard-scroll-view';
import { TRANSACTION_NOTE_INPUT_MIN_HEIGHT } from '../../constant/transaction-note-input-min-height.constant';
import { TransactionKeypadContext } from '../../context/transaction-keypad.context';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly topInset: number;
}

const SCROLL_STYLE = { flex: 1 };
const FOOTER_FADE_CLEARANCE = 44;
const CONTENT_STYLE = { paddingHorizontal: 20, paddingBottom: 12 };

export const QuickFormScroll = ({ children, topInset }: Props) => {
    const { chromeHeight, inset } = useBottomChromeInset();
    const { dismiss } = use(TransactionKeypadContext);

    const includeTopSafeArea = isPositiveNumber(topInset);
    const bottomInset = chromeHeight + FOOTER_FADE_CLEARANCE;
    const keyboardOffset = inset + TRANSACTION_NOTE_INPUT_MIN_HEIGHT;

    return (
        <ChromeKeyboardScrollView
            style={SCROLL_STYLE}
            contentContainerStyle={CONTENT_STYLE}
            contentInsetTop={topInset}
            includeTopSafeArea={includeTopSafeArea}
            contentInsetBottom={bottomInset}
            bottomOffset={keyboardOffset}
            disableScrollOnKeyboardHide
            alwaysBounceVertical
            showsVerticalScrollIndicator={false}
            onDragStart={dismiss}
            testID={SimpleQuickFormSelector.Scroll}
        >
            {children}
        </ChromeKeyboardScrollView>
    );
};

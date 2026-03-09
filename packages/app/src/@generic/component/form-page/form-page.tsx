import { ReactNode } from 'react';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { Edge, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { FORM_PAGE_FOOTER_PADDING, FORM_PAGE_TOP_PADDING } from '../../constant/form-page-spacing.constant';
import { Footer } from '../footer/footer';
import { Page } from '../page/page';

import type { ViewStyle } from 'react-native';

interface Props {
    readonly header: ReactNode;
    readonly children: ReactNode;
    readonly footer?: ReactNode;
    readonly testID?: string;
    readonly onScroll?: EmptyFn;
    readonly safeEdges?: Edge[];
    readonly contentContainerStyle?: ViewStyle;
}

export const FormPage = ({ header, children, footer, testID, onScroll, safeEdges, contentContainerStyle }: Props) => {
    const { bottom } = useSafeAreaInsets();

    const defaultContentContainerStyle = {
        paddingTop: FORM_PAGE_TOP_PADDING,
        paddingBottom: bottom + FORM_PAGE_FOOTER_PADDING
    } satisfies ViewStyle;

    const footerContent = isDefined(footer) ? (
        <KeyboardStickyView>
            <Footer withBlur>{footer}</Footer>
        </KeyboardStickyView>
    ) : undefined;

    return (
        <Page testID={testID} header={header} footer={footerContent} safeEdges={safeEdges} withBlur>
            <KeyboardAwareScrollView
                onScroll={onScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[defaultContentContainerStyle, contentContainerStyle]}
            >
                {children}
            </KeyboardAwareScrollView>
        </Page>
    );
};

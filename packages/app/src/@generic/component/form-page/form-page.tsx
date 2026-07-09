import { ReactNode, RefObject } from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Edge, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { FORM_PAGE_FOOTER_PADDING, FORM_PAGE_TOP_PADDING } from '../../constant/form-page-spacing.constant';
import { ChromePage } from '../chrome-page/chrome-page';

import type { ViewStyle } from 'react-native';
import type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

interface Props {
    readonly header: ReactNode;
    readonly children: ReactNode;
    readonly footer?: ReactNode;
    readonly testID?: string;
    readonly scrollViewTestID?: string;
    readonly onScroll?: EmptyFn;
    readonly safeEdges?: Edge[];
    readonly contentContainerStyle?: ViewStyle;
    readonly scrollViewRef?: RefObject<KeyboardAwareScrollViewRef | null>;
    readonly extraBottomPadding?: number;
}

export const FormPage = ({
    header,
    children,
    footer,
    testID,
    scrollViewTestID,
    onScroll,
    safeEdges,
    contentContainerStyle,
    scrollViewRef,
    extraBottomPadding = 0
}: Props) => {
    const { bottom } = useSafeAreaInsets();

    const defaultContentContainerStyle = {
        paddingTop: FORM_PAGE_TOP_PADDING,
        paddingBottom: bottom + FORM_PAGE_FOOTER_PADDING + extraBottomPadding
    } satisfies ViewStyle;
    const scrollContentContainerStyle = [defaultContentContainerStyle, contentContainerStyle];

    const footerContent = isDefined(footer) ? <View className="gap-md pt-xl px-7xl">{footer}</View> : null;

    return (
        <ChromePage testID={testID} header={header} footer={footerContent} safeEdges={safeEdges}>
            <KeyboardAwareScrollView
                ref={scrollViewRef}
                testID={scrollViewTestID}
                onScroll={onScroll}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={scrollContentContainerStyle}
            >
                {children}
            </KeyboardAwareScrollView>
        </ChromePage>
    );
};

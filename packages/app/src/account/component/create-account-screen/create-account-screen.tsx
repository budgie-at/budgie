import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';

import { CreateAccountScreenSelector } from './create-account-screen.selector';

interface Props {
    readonly title: string;
    readonly onSubmit: EmptyFn;
    readonly isSubmitting?: boolean;
    readonly isSubmitDisabled?: boolean;
    readonly children: ReactNode;
}

const CURRENCY_ROW_KEYBOARD_BOTTOM_OFFSET = 250;
const SCROLL_VIEW_PROPS = { bottomOffset: CURRENCY_ROW_KEYBOARD_BOTTOM_OFFSET };

export const CreateAccountScreen = ({ title, children, onSubmit, isSubmitting, isSubmitDisabled }: Props) => {
    const { t } = useLingui();
    const submitLabel = isSubmitDisabled ? t`Add a name to continue` : t`Create account`;

    return (
        <CollapsibleChromePage
            title={title}
            leading={<HeaderBackButton />}
            testID={CreateAccountScreenSelector.ScrollView}
            scrollViewProps={SCROLL_VIEW_PROPS}
            footer={
                <View className="border-t-hairline border-surface-separator bg-surface px-5xl pt-lg">
                    <View className="absolute inset-x-0 top-full h-[64px] bg-surface" pointerEvents="none" />
                    <PillButton
                        label={submitLabel}
                        isLoading={isSubmitting}
                        isDisabled={isSubmitDisabled}
                        testID={CreateAccountScreenSelector.SubmitButton}
                        onPress={onSubmit}
                    />
                </View>
            }
        >
            {children}
        </CollapsibleChromePage>
    );
};

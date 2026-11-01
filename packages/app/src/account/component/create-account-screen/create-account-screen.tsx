import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';

import { EmptyFn } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';

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
                <PillButtonFooter
                    label={submitLabel}
                    isLoading={isSubmitting}
                    isDisabled={isSubmitDisabled}
                    testID={CreateAccountScreenSelector.SubmitButton}
                    onPress={onSubmit}
                />
            }
        >
            {children}
        </CollapsibleChromePage>
    );
};

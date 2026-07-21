import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

import { CreateAccountScreenSelector } from './create-account-screen.selector';

interface Props {
    readonly title: string;
    readonly variant: ColorPaletteVariant;
    readonly onSubmit: EmptyFn;
    readonly isSubmitting?: boolean;
    readonly children: ReactNode;
}

const CURRENCY_ROW_KEYBOARD_BOTTOM_OFFSET = 250;
const SCROLL_VIEW_PROPS = { bottomOffset: CURRENCY_ROW_KEYBOARD_BOTTOM_OFFSET };

export const CreateAccountScreen = ({ title, variant, children, onSubmit, isSubmitting }: Props) => {
    const { t } = useLingui();

    return (
        <CollapsibleChromePage
            title={title}
            leading={<HeaderBackButton />}
            testID={CreateAccountScreenSelector.ScrollView}
            scrollViewProps={SCROLL_VIEW_PROPS}
            footer={
                <View className="gap-md pt-xl px-7xl">
                    <Button
                        variant={variant}
                        onPress={onSubmit}
                        isLoading={isSubmitting}
                        content={t`Submit`}
                        testID={CreateAccountScreenSelector.SubmitButton}
                    />
                </View>
            }
        >
            {children}
        </CollapsibleChromePage>
    );
};

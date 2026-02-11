import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Footer } from '../../../@generic/component/footer/footer';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';

interface Props {
    readonly title: string;
    readonly description?: string;
    readonly descriptionClassName?: string;
    readonly variant: ColorPaletteVariant;
    readonly onSubmit: EmptyFn;
    readonly children: ReactNode;
}

export const CreateAccountScreen = (props: Props) => {
    const { title, description, descriptionClassName, variant, children, onSubmit } = props;
    const { t } = useLingui();

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <Page
            header={
                <PageHeader
                    title={title}
                    onGoBack={handleGoBack}
                    descriptionClassName={descriptionClassName}
                    description={description ?? t`Fill in the account details`}
                />
            }
            footer={
                <KeyboardStickyView>
                    <Footer>
                        <Button variant={variant} onPress={onSubmit} content={t`Submit`} />
                    </Footer>
                </KeyboardStickyView>
            }
        >
            <KeyboardAwareScrollView
                contentContainerClassName="pb-5xl"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {children}
            </KeyboardAwareScrollView>
        </Page>
    );
};

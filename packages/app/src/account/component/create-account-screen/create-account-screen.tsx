import { DebtAccountCreateInputInterface, LiabilityAccountCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { Control } from 'react-hook-form';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Footer } from '../../../@generic/component/footer/footer';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { AccountBalanceField } from '../account-balance-field/account-balance-field';

interface Props<T extends LiabilityAccountCreateInputInterface | DebtAccountCreateInputInterface> {
    readonly title: string;
    readonly description?: string;
    readonly descriptionClassName?: string;
    readonly control: Control<T>;
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly allowNegativeBalance?: boolean;
    readonly onSubmit: EmptyFn;
    readonly children: ReactNode;
}

export const CreateAccountScreen = <T extends LiabilityAccountCreateInputInterface | DebtAccountCreateInputInterface>(props: Props<T>) => {
    const { title, description, control, descriptionClassName, instrumentSymbol, variant, allowNegativeBalance, children, onSubmit } =
        props;
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
                <AccountBalanceField
                    variant={variant}
                    instrumentSymbol={instrumentSymbol}
                    control={control}
                    allowNegative={allowNegativeBalance}
                />

                {children}
            </KeyboardAwareScrollView>
        </Page>
    );
};

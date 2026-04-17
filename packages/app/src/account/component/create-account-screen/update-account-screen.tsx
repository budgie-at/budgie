import {
    AccountEntityInterface,
    AccountTypeEnum,
    DebtAccountCreateInputInterface,
    LiabilityAccountCreateInputInterface
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';
import { Control, FieldValues, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { Button } from '../../../@generic/component/button/button';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { FormPage } from '../../../@generic/component/form-page/form-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_DEBT_TYPE_COLOR } from '../../constant/account-debt-type-color.constant';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { AccountActiveToggleField } from '../account-active-toggle-field/account-active-toggle-field';
import { AccountBalanceField } from '../account-balance-field/account-balance-field';
import { ArchiveAccount } from '../archive-account/archive-account';

import { CreateAccountScreenSelector } from './create-account-screen.selector';

interface Props<T extends FieldValues> {
    readonly account: AccountEntityInterface;
    readonly instrumentSymbol: string;
    readonly allowNegativeBalance?: boolean;
    readonly children?: ReactNode;
    readonly control: Control<T>;
    readonly onSubmit: EmptyFn;
}

const descriptionVariants = cva('uppercase', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const UpdateAccountScreen = <T extends LiabilityAccountCreateInputInterface | DebtAccountCreateInputInterface>(props: Props<T>) => {
    const { children, account, onSubmit, control, instrumentSymbol, allowNegativeBalance } = props;
    const { t } = useLingui();

    const formValues = useWatch({ control });
    const currentType = isDefined(formValues.type) ? (formValues.type as AccountTypeEnum) : account.type;

    const handleGoBack = () => void goBackOrReplace('/');

    const description = t(ACCOUNT_TYPE[currentType]);
    const variant = currentType === AccountTypeEnum.DEBT ? ACCOUNT_DEBT_TYPE_COLOR[account.debtType] : ACCOUNT_COLOR[currentType];

    return (
        <FormPage
            header={
                <PageHeader
                    iconVariant={variant}
                    onGoBack={handleGoBack}
                    description={description}
                    title={t`Account Settings`}
                    descriptionClassName={descriptionVariants({ variant })}
                />
            }
            footer={
                <View className="flex-row gap-2">
                    <ArchiveAccount accountId={account.id} />
                    <Button
                        onPress={onSubmit}
                        size="sm"
                        variant={variant}
                        content={t`Update Account`}
                        className="flex-1"
                        testID={CreateAccountScreenSelector.SubmitButton}
                    />
                </View>
            }
        >
            <AccountBalanceField
                variant={variant}
                instrumentSymbol={instrumentSymbol}
                control={control}
                allowNegative={allowNegativeBalance}
            />

            <FormLayoutGroup>
                <AccountDetailsField
                    control={control}
                    variant={variant}
                    nameInputTestID={CreateAccountScreenSelector.NameInput}
                    selectNameOnFocus
                />

                {children}

                <AccountActiveToggleField control={control} />
            </FormLayoutGroup>
        </FormPage>
    );
};

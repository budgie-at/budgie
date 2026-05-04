import {
    AccountEntityInterface,
    AccountTypeEnum,
    DebtAccountCreateInputInterface,
    LiabilityAccountCreateInputInterface
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { Control, FieldValues } from 'react-hook-form';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { Button } from '../../../@generic/component/button/button';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { FormPage } from '../../../@generic/component/form-page/form-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_DEBT_TYPE_COLOR } from '../../constant/account-debt-type-color.constant';
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

export const UpdateAccountScreen = <T extends LiabilityAccountCreateInputInterface | DebtAccountCreateInputInterface>(props: Props<T>) => {
    const { children, account, onSubmit, control, instrumentSymbol, allowNegativeBalance } = props;
    const { t } = useLingui();

    const handleGoBack = () => void goBackOrReplace('/');

    const variant = account.type === AccountTypeEnum.DEBT ? ACCOUNT_DEBT_TYPE_COLOR[account.debtType] : ACCOUNT_COLOR[account.type];

    return (
        <FormPage
            scrollViewTestID={CreateAccountScreenSelector.ScrollView}
            header={<PageHeader iconVariant={variant} onGoBack={handleGoBack} title={t`Account Settings`} />}
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

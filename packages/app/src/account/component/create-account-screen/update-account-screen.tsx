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
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
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
    readonly isSubmitting?: boolean;
}

export const UpdateAccountScreen = <T extends LiabilityAccountCreateInputInterface | DebtAccountCreateInputInterface>(props: Props<T>) => {
    const { children, account, onSubmit, control, instrumentSymbol, allowNegativeBalance, isSubmitting } = props;
    const { t } = useLingui();

    const variant = ACCOUNT_COLOR[account.type];
    const showInstrumentAfterAmount = account.type === AccountTypeEnum.CRYPTO;
    const minimumDecimalPlaces = account.type === AccountTypeEnum.CRYPTO ? MICRO_UNIT_DECIMAL_PLACES : 0;

    return (
        <CollapsibleChromePage
            title={t`Account Settings`}
            leading={<HeaderBackButton />}
            testID={CreateAccountScreenSelector.ScrollView}
            footer={
                <View className="gap-md pt-xl px-7xl">
                    <View className="flex-row gap-2">
                        <ArchiveAccount accountId={account.id} />
                        <Button
                            onPress={onSubmit}
                            size="sm"
                            variant={variant}
                            isLoading={isSubmitting}
                            content={t`Update Account`}
                            className="flex-1"
                            testID={CreateAccountScreenSelector.SubmitButton}
                        />
                    </View>
                </View>
            }
        >
            <AccountBalanceField
                variant={variant}
                instrumentSymbol={instrumentSymbol}
                control={control}
                allowNegative={allowNegativeBalance}
                minimumDecimalPlaces={minimumDecimalPlaces}
                showInstrumentAfterAmount={showInstrumentAfterAmount}
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
        </CollapsibleChromePage>
    );
};

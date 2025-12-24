import {
    AccountCreateEntityInterface,
    AccountDebtTypeEnum,
    AccountNatureEnum,
    AccountTypeEnum,
    DebtAccountCreateInputInterface,
    UserIconNameEnum
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Controller } from 'react-hook-form';
import { View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CreateAccountDetailsField } from '../../../@generic/component/create-account-details-field/create-account-details-field';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { Footer } from '../../../@generic/component/footer/footer';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { useDebtAccountForm } from '../../hooks/use-debt-account-form.hook';
import { accountService } from '../../service/account.service';
import { AccountSelector } from '../account-selector/account-selector';
import { DebtAccountBalanceField } from '../debt-account-balance-field/debt-account-balance-field';
import { AccountFormDateField } from '../account-form-date-field/account-form-date-field';
import { AccountDeptTypeCard } from '../account-dept-type-card/account-dept-type-card';
import ContactSelector from '../../../@generic/component/contact-selector/contact-selector';

const DEFAULT_ICON = UserIconNameEnum.HandCoins;

export const CreateDebtAccount = () => {
    const { defaultInstrument } = useSettingsContext();
    const { t } = useLingui();

    const { control, handleSubmit, instrument, debtType } = useDebtAccountForm({
        title: '',
        accountId: 0,
        returnAt: null,
        amountToReturn: 0,
        currentBalance: 0,
        icon: DEFAULT_ICON,
        type: AccountTypeEnum.DEBT,
        debtType: AccountDebtTypeEnum.LENT,
        instrumentId: defaultInstrument.id,
        nature: AccountNatureEnum.LIABILITY
    });

    const handleGoBack = () => void goBackOrReplace('/');

    if (!isDefined(instrument)) {
        return <EmptyScreen />;
    }

    const handleCreate = async (values: DebtAccountCreateInputInterface) => {
        try {
            await accountService.createDebt(values);

            void router.replace('/');
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong`,
                text2: t`Please try again later`
            });
        }
    };

    return (
        <Page
            header={<PageHeader onGoBack={handleGoBack} title={t`Debt Account`} description={t`Fill in the account details`} />}
            footer={
                <KeyboardStickyView>
                    <Footer>
                        <Button variant={ACCOUNT_COLOR.DEBT} onPress={handleSubmit(handleCreate)} content={t`Submit`} />
                    </Footer>
                </KeyboardStickyView>
            }
        >
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <DebtAccountBalanceField variant={ACCOUNT_COLOR.DEBT} instrumentSymbol={instrument.symbol} control={control} />

                <FormLayoutGroup>
                    <CreateAccountDetailsField variant={ACCOUNT_COLOR.DEBT} control={control} />

                    <Controller
                        render={({ field: { value, onChange } }) => (
                            <View className="flex-row gap-x-xl">
                                <AccountDeptTypeCard
                                    type={AccountDebtTypeEnum.LENT}
                                    isSelected={value === AccountDebtTypeEnum.LENT}
                                    onSelect={onChange}
                                />
                                <AccountDeptTypeCard
                                    type={AccountDebtTypeEnum.BORROW}
                                    isSelected={value === AccountDebtTypeEnum.BORROW}
                                    onSelect={onChange}
                                />
                            </View>
                        )}
                        control={control}
                        name="debtType"
                    />

                    <FormItem label={t`Contact (optional)`}>
                        <ContactSelector />
                    </FormItem>

                    <Controller
                        render={({ field: { value, onChange } }) => {
                            const descriptionMap = {
                                [AccountDebtTypeEnum.LENT]: {
                                    true: t`Money came from here`,
                                    false: t`Which account did the money come from?`
                                },
                                [AccountDebtTypeEnum.BORROW]: {
                                    true: t`Money will be added here`,
                                    false: t`Which account did the money come from?`
                                }
                            };

                            const description = descriptionMap[debtType][isPositiveNumber(value)];

                            return (
                                <FormItem label={t`Link to Account (Optional)`}>
                                    <AccountSelector
                                        description={description}
                                        accountId={value}
                                        variant={ACCOUNT_COLOR.DEBT}
                                        onSelect={onChange}
                                    />
                                </FormItem>
                            );
                        }}
                        name="accountId"
                        control={control}
                    />

                    <AccountFormDateField control={control} variant={ACCOUNT_COLOR.DEBT} />
                </FormLayoutGroup>
            </KeyboardAwareScrollView>
        </Page>
    );
};

import { AccountDebtTypeEnum, AccountTypeEnum, DebtAccountCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { Button } from '../../../@generic/component/button/button';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { Footer } from '../../../@generic/component/footer/footer';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { useDebtAccountForm } from '../../hooks/use-debt-account-form.hook';
import { accountService } from '../../service/account.service';
import { AccountBalanceField } from '../account-balance-field/account-balance-field';
import { AccountFormDateField } from '../account-form-date-field/account-form-date-field';
import { AccountTargetBalanceField } from '../account-target-balance-field.tsx/account-target-balance-field';
import { DebtAccountAccountField } from '../debt-account-account-field/debt-account-account-field';
import { DebtAccountContactField } from '../debt-account-contact-field/debt-account-contact-field';
import { DebtAccountTypeField } from '../debt-account-type-field/debt-account-type-field';

const DEFAULT_ICON = UserIconNameEnum.HandCoins;

export const CreateDebtAccount = () => {
    const { defaultInstrument } = useSettingsContext();
    const { t } = useLingui();

    const { control, handleSubmit, instrument, debtType } = useDebtAccountForm({
        iban: '',
        title: '',
        accountId: 0,
        deadline: null,
        contactId: null,
        targetBalance: 0,
        currentBalance: 0,
        icon: DEFAULT_ICON,
        type: AccountTypeEnum.DEBT,
        debtType: AccountDebtTypeEnum.LENT,
        instrumentId: defaultInstrument.id
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
            <KeyboardAwareScrollView contentContainerClassName='pb-5xl' keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <AccountBalanceField variant={ACCOUNT_COLOR.DEBT} instrumentSymbol={instrument.symbol} control={control} />

                <FormLayoutGroup>
                    <AccountDetailsField variant={ACCOUNT_COLOR.DEBT} control={control} />

                    <AccountTargetBalanceField control={control} />

                    <DebtAccountTypeField control={control} />

                    <DebtAccountContactField control={control} />

                    <DebtAccountAccountField debtType={debtType} control={control} />

                    <AccountFormDateField control={control} variant={ACCOUNT_COLOR.DEBT} />
                </FormLayoutGroup>
            </KeyboardAwareScrollView>
        </Page>
    );
};

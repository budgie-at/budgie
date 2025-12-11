import { AccountCreateEntityInterface, AccountNatureEnum, AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/components/button/button';
import { CreateAccountCurrencyField } from '../../../@generic/components/create-account-currency-field/create-account-currency-field';
import { CreateAccountDetailsField } from '../../../@generic/components/create-account-details-field/create-account-details-field';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { FullPage } from '../../../@generic/components/page/full-page';
import { PageHeader } from '../../../@generic/components/page-header/page-header';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { useAccountForm } from '../../hooks/use-account-form.hook';
import { accountService } from '../../service/account.service';
import { AccountBalanceField } from '../create-account-balance-field/account-balance-field';

interface Props {
    readonly type: AccountTypeEnum.BANK | AccountTypeEnum.CASH;
    readonly title: string;
}

const DEFAULT_ICON = UserIconNameEnum.Home;

export const CreateLiabilityAccount = ({ type, title }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const { t } = useLingui();

    const { control, handleSubmit, reset, instrument, prepareSubmitData } = useAccountForm({
        type,
        title: '',
        currentBalance: 0,
        icon: DEFAULT_ICON,
        instrumentId: defaultInstrument.id,
        nature: AccountNatureEnum.LIABILITY
    });

    if (!isDefined(instrument)) {
        return null;
    }

    const handleCreate = async (values: AccountCreateEntityInterface) => {
        try {
            await accountService.create(prepareSubmitData(values));

            void router.dismissAll();
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong`,
                text2: t`Please try again later`
            });
        }
    };

    const variant = ACCOUNT_COLOR[type];

    return (
        <FullPage
            header={<PageHeader showBackBtn onGoBack={reset} title={title} description={t`Fill in the account details`} />}
            footer={
                <View className="pt-3xl px-5xl border-t-1 border-t-secondary-corner">
                    <Button variant={variant} onPress={handleSubmit(handleCreate)} content={t`Submit`} />
                </View>
            }
        >
            <AccountBalanceField variant={variant} instrumentSymbol={instrument.symbol} control={control} />

            <FormLayoutGroup>
                <CreateAccountDetailsField variant={variant} control={control} />
                <CreateAccountCurrencyField control={control} />
            </FormLayoutGroup>
        </FullPage>
    );
};

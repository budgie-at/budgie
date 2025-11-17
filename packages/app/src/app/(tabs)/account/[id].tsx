import { CurrencyEnum } from '@budgie/contracts';
import { Redirect, useGlobalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Page } from '../../../@generic/components/page/page';
import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { isEnumValue } from '../../../@generic/type-guard/is-enum-value.type-guard';
import { AccountBalance } from '../../../account/component/account-balance/account-balance';
import { AccountHeader } from '../../../account/component/account-header/account-header';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';

export default function Account() {
    const params = useGlobalSearchParams<IdParamInterface>();
    const id = Number(params.id);

    const { account, isLoading } = useGetAccountByIdQuery(id);
    const { defaultCurrency } = useSettingsContext();

    if (isLoading) {
        return null;
    }

    if (!isDefined(account)) {
        return <Redirect href="/" />;
    }

    const { title, icon, currentBalance, type, instrument } = account;
    const currency = isEnumValue(instrument.code, CurrencyEnum) ? instrument.code : defaultCurrency;

    return (
        <Page header={<AccountHeader showBackBtn id={id} title={title} icon={icon} type={type} />}>
            <View className="py-[30px]">
                <AccountBalance currency={currency} balance={currentBalance} />
            </View>
        </Page>
    );
}

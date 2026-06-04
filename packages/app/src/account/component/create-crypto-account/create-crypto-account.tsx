import { AccountTypeEnum, InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { CreateAccountCurrencyField } from '../../../@generic/component/create-account-currency-field/create-account-currency-field';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { useGetInstrumentsByTypeQuery } from '../../../instrument/query/use-get-instruments-by-type.query';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { useCryptoAccountForm } from '../../hooks/use-crypto-account-form.hook';
import { accountService } from '../../service/account.service';
import { AccountBalanceField } from '../account-balance-field/account-balance-field';
import { CreateAccountScreen } from '../create-account-screen/create-account-screen';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';
import { IncludeInNetWorthField } from '../include-in-net-worth-field/include-in-net-worth-field';

export const CreateCryptoAccount = () => {
    const { t } = useLingui();
    const { instruments } = useGetInstrumentsByTypeQuery(InstrumentTypeEnum.CRYPTO);
    const defaultCryptoInstrument = instruments.at(0);
    const defaultInstrumentId = defaultCryptoInstrument?.id ?? 0;

    const { control, handleSubmit, instrument } = useCryptoAccountForm(
        {
            type: AccountTypeEnum.CRYPTO,
            title: '',
            currentBalance: 0,
            icon: UserIconNameEnum.Bitcoin,
            includeInNetWorth: true,
            instrumentId: defaultInstrumentId
        },
        async values => await accountService.create(values)
    );

    if (!isDefined(defaultCryptoInstrument) || !isDefined(instrument)) {
        return <EmptyScreen />;
    }

    return (
        <CreateAccountScreen title={t`Crypto Account`} variant={ACCOUNT_COLOR.CRYPTO} onSubmit={handleSubmit}>
            <AccountBalanceField variant={ACCOUNT_COLOR.CRYPTO} instrumentSymbol={instrument.symbol} control={control} />

            <FormLayoutGroup>
                <AccountDetailsField
                    variant={ACCOUNT_COLOR.CRYPTO}
                    control={control}
                    nameInputTestID={CreateAccountScreenSelector.NameInput}
                />
                <CreateAccountCurrencyField control={control} instrumentType={InstrumentTypeEnum.CRYPTO} />
                <IncludeInNetWorthField control={control} />
            </FormLayoutGroup>
        </CreateAccountScreen>
    );
};

// jscpd:ignore-start
import { AccountTypeEnum, InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { CreateAccountCurrencyField } from '../../../@generic/component/create-account-currency-field/create-account-currency-field';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { useGetInstrumentsByTypeQuery } from '../../../instrument/query/use-get-instruments-by-type.query';
import { historicalMarketDataLoaderService } from '../../../market-data/service/historical-market-data-loader.service';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
// jscpd:ignore-end
import { useAccountForm } from '../../hooks/use-account-form.hook';
import { accountService } from '../../service/account.service';
import { AccountBalanceField } from '../account-balance-field/account-balance-field';
import { CreateAccountScreen } from '../create-account-screen/create-account-screen';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';
import { IncludeInNetWorthField } from '../include-in-net-worth-field/include-in-net-worth-field';

interface Props {
    readonly type: AccountTypeEnum.BANK | AccountTypeEnum.CASH | AccountTypeEnum.CRYPTO;
    readonly title: string;
    readonly allowNegative?: boolean;
    readonly defaultIcon?: UserIconNameEnum;
    readonly instrumentType?: InstrumentTypeEnum;
}

const DEFAULT_ICON = UserIconNameEnum.Home;

export const CreateLiabilityAccount = ({
    type,
    title,
    allowNegative = true,
    defaultIcon = DEFAULT_ICON,
    instrumentType = InstrumentTypeEnum.FIAT
}: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const { instruments } = useGetInstrumentsByTypeQuery(instrumentType);
    const cryptoInstrumentId = instruments.at(0)?.id;
    const isMissingCryptoInstrument = instrumentType === InstrumentTypeEnum.CRYPTO && !isDefined(cryptoInstrumentId);
    const instrumentId = isDefined(cryptoInstrumentId) ? cryptoInstrumentId : defaultInstrument.id;

    const formValues = {
        type,
        title: '',
        currentBalance: 0,
        icon: defaultIcon,
        includeInNetWorth: true,
        instrumentId
    };

    const { control, handleSubmit, instrument } = useAccountForm(formValues, async values => {
        const account = await accountService.create(values);

        void historicalMarketDataLoaderService.enqueueAccounts([account]).catch(emptyFn);

        return account;
    });

    if (isMissingCryptoInstrument || !isDefined(instrument)) {
        return <EmptyScreen />;
    }

    const variant = ACCOUNT_COLOR[type];
    const showInstrumentAfterAmount = type === AccountTypeEnum.CRYPTO;
    const minimumDecimalPlaces = type === AccountTypeEnum.CRYPTO ? MICRO_UNIT_DECIMAL_PLACES : 0;

    return (
        <CreateAccountScreen title={title} variant={variant} onSubmit={handleSubmit}>
            <AccountBalanceField
                variant={variant}
                instrumentSymbol={instrument.symbol}
                control={control}
                allowNegative={allowNegative}
                minimumDecimalPlaces={minimumDecimalPlaces}
                showInstrumentAfterAmount={showInstrumentAfterAmount}
            />

            <FormLayoutGroup>
                <AccountDetailsField variant={variant} control={control} nameInputTestID={CreateAccountScreenSelector.NameInput} />
                <CreateAccountCurrencyField control={control} instrumentType={instrumentType} />
                <IncludeInNetWorthField control={control} />
            </FormLayoutGroup>
        </CreateAccountScreen>
    );
};

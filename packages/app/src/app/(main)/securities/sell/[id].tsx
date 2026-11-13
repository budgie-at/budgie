import { InstrumentPriceProviderEnum, InstrumentTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { useAccountBalanceQuery } from '../../../../account/query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../../../../account/query/use-get-account-by-id.query';
import { useGetAccountsByIntegrationIdQuery } from '../../../../account/query/use-get-accounts-by-integration-id.query';
import { SecurityHoldingRow } from '../../../../brokerage/component/security-holding-row/security-holding-row';
import { SecurityTradeAmountSection } from '../../../../brokerage/component/security-trade-amount-section/security-trade-amount-section';
import { SecurityTradeForm } from '../../../../brokerage/component/security-trade-form/security-trade-form';
import { useSecurityPriceQuery } from '../../../../brokerage/query/use-security-price.query';
import { BrokerageService } from '../../../../brokerage/service/brokerage.service';

import type { SecurityTradeFormValues } from '../../../../brokerage/constant/security-trade-form-schema.constant';

export default function SellSecurity() {
    const { t } = useLingui();
    const accountId = Number(useLocalSearchParams<IdParamInterface>().id);

    const { account } = useGetAccountByIdQuery(accountId);
    const { balance } = useAccountBalanceQuery(accountId);
    const { accounts } = useGetAccountsByIntegrationIdQuery(account?.integrationId ?? 0);
    const cashAccounts = accounts?.filter(candidate => candidate.instrument.type === InstrumentTypeEnum.FIAT) ?? [];
    const cash = cashAccounts.find(candidate => candidate.instrumentId === account?.instrument.quoteInstrumentId) ?? cashAccounts.at(0);
    const currencySymbol = cash?.instrument.symbol ?? '';
    const yahooSymbol =
        account?.instrument.priceProvider === InstrumentPriceProviderEnum.YAHOO ? account.instrument.providerInstrumentId : null;
    const suggestedPrice = useSecurityPriceQuery(yahooSymbol ?? '', cash?.instrument.code ?? '');

    const handleSubmit = (values: SecurityTradeFormValues) =>
        Effect.flatMap(BrokerageService, brokerageService => brokerageService.sell(accountId, values));

    return (
        <SecurityTradeForm
            title={t`Sell`}
            currencySymbol={currencySymbol}
            isReady
            maxQuantity={balance}
            suggestedPrice={suggestedPrice}
            onSubmit={handleSubmit}
            summary={<SecurityTradeAmountSection title={t`Proceeds`} feeSign={-1} currencySymbol={currencySymbol} />}
        >
            {isDefined(account) ? <SecurityHoldingRow balance={balance} instrument={account.instrument} /> : null}
        </SecurityTradeForm>
    );
}

import { InstrumentPriceProviderEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { useAccountBalanceQuery } from '../../../../account/query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../../../../account/query/use-get-account-by-id.query';
import { useGetAccountsByIntegrationIdQuery } from '../../../../account/query/use-get-accounts-by-integration-id.query';
import { SecurityHoldingRow } from '../../../../brokerage/component/security-holding-row/security-holding-row';
import { SecurityTradeForm } from '../../../../brokerage/component/security-trade-form/security-trade-form';
import { SecurityTradeSideEnum } from '../../../../brokerage/enum/security-trade-side.enum';
import { useSecurityPriceQuery } from '../../../../brokerage/query/use-security-price.query';
import { BrokerageService } from '../../../../brokerage/service/brokerage.service';

import type { SecurityTradeFormValues } from '../../../../brokerage/constant/security-trade-form-schema.constant';

export default function SellSecurity() {
    const accountId = Number(useLocalSearchParams<IdParamInterface>().id);

    const { account } = useGetAccountByIdQuery(accountId);
    const { balance } = useAccountBalanceQuery(accountId);
    const { accounts } = useGetAccountsByIntegrationIdQuery(account?.integrationId ?? 0);
    const yahooSymbol =
        account?.instrument.priceProvider === InstrumentPriceProviderEnum.YAHOO ? account.instrument.providerInstrumentId : null;
    const suggestedPrice = useSecurityPriceQuery(yahooSymbol ?? '', accounts ?? []);
    const currencySymbol = suggestedPrice.cash?.instrument.symbol ?? '';

    const handleSubmit = (values: SecurityTradeFormValues) =>
        Effect.flatMap(BrokerageService, brokerageService => brokerageService.sell(accountId, values));

    return (
        <SecurityTradeForm
            side={SecurityTradeSideEnum.SELL}
            symbol={account?.instrument.symbol ?? ''}
            currencySymbol={currencySymbol}
            maxQuantity={balance}
            suggestedPrice={suggestedPrice}
            onSubmit={handleSubmit}
        >
            {isDefined(account) ? <SecurityHoldingRow balance={balance} instrument={account.instrument} /> : null}
        </SecurityTradeForm>
    );
}

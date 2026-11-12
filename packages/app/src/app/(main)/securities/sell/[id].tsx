import { InstrumentTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useLocalSearchParams } from 'expo-router';

import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { useGetAccountByIdQuery } from '../../../../account/query/use-get-account-by-id.query';
import { useGetAccountsByIntegrationIdQuery } from '../../../../account/query/use-get-accounts-by-integration-id.query';
import { SecurityTradeForm } from '../../../../brokerage/component/security-trade-form/security-trade-form';
import { BrokerageService } from '../../../../brokerage/service/brokerage.service';

import type { SecurityTradeFormValues } from '../../../../brokerage/constant/security-trade-form-schema.constant';

export default function SellSecurity() {
    const { t } = useLingui();
    const accountId = Number(useLocalSearchParams<IdParamInterface>().id);

    const { account } = useGetAccountByIdQuery(accountId);
    const { accounts } = useGetAccountsByIntegrationIdQuery(account?.integrationId ?? 0);
    const cashAccounts = accounts?.filter(candidate => candidate.instrument.type === InstrumentTypeEnum.FIAT) ?? [];
    const cash = cashAccounts.find(candidate => candidate.instrumentId === account?.instrument.quoteInstrumentId) ?? cashAccounts.at(0);

    const handleSubmit = (values: SecurityTradeFormValues) =>
        Effect.flatMap(BrokerageService, brokerageService => brokerageService.sell(accountId, values));

    return <SecurityTradeForm title={t`Sell`} currencySymbol={cash?.instrument.symbol ?? ''} isReady onSubmit={handleSubmit} />;
}

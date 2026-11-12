import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useLocalSearchParams } from 'expo-router';

import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { SecurityTradeForm } from '../../../../brokerage/component/security-trade-form/security-trade-form';
import { BrokerageService } from '../../../../brokerage/service/brokerage.service';

import type { SecurityTradeFormValues } from '../../../../brokerage/constant/security-trade-form-schema.constant';

export default function SellSecurity() {
    const { t } = useLingui();
    const accountId = Number(useLocalSearchParams<IdParamInterface>().id);

    const handleSubmit = (values: SecurityTradeFormValues) =>
        Effect.flatMap(BrokerageService, brokerageService => brokerageService.sell(accountId, values));

    return <SecurityTradeForm title={t`Sell`} isReady onSubmit={handleSubmit} />;
}

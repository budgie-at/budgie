import { InstrumentTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useGetAccountsByIntegrationIdQuery } from '../../../../account/query/use-get-accounts-by-integration-id.query';
import { SecurityPickerRow } from '../../../../brokerage/component/security-picker-row/security-picker-row';
import { SecurityTradeForm } from '../../../../brokerage/component/security-trade-form/security-trade-form';
import { SecurityTradeSideEnum } from '../../../../brokerage/enum/security-trade-side.enum';
import { useSecurityPriceQuery } from '../../../../brokerage/query/use-security-price.query';
import { BrokerageService } from '../../../../brokerage/service/brokerage.service';

import type { SecurityTradeFormValues } from '../../../../brokerage/constant/security-trade-form-schema.constant';
import type { SecurityBuyParamsType } from '../../../../brokerage/interface/security-buy-params.type';
import type { YahooListingInterface } from '@budgie/market';

export default function BuySecurity() {
    const { t } = useLingui();
    const params = useLocalSearchParams<SecurityBuyParamsType>();
    const integrationId = Number(params.id);
    const { accounts } = useGetAccountsByIntegrationIdQuery(integrationId);
    const [listing, setListing] = useState<YahooListingInterface | null>(() =>
        isNotEmptyString(params.symbol)
            ? {
                  symbol: params.symbol,
                  name: params.name ?? params.symbol,
                  exchange: params.exchange ?? '',
                  type: params.type === InstrumentTypeEnum.ETF ? InstrumentTypeEnum.ETF : InstrumentTypeEnum.EQUITY
              }
            : null
    );
    const suggestedPrice = useSecurityPriceQuery(listing?.symbol ?? '', accounts ?? [], null);

    const handleSubmit = (values: SecurityTradeFormValues) =>
        isDefined(listing)
            ? Effect.flatMap(BrokerageService, brokerageService =>
                  brokerageService.buy(integrationId, listing, values, t({ message: 'Deposit', context: 'Brokerage funding' }))
              )
            : Effect.void;

    const currencySymbol = suggestedPrice.cash?.instrument.symbol ?? '';

    return (
        <SecurityTradeForm
            side={SecurityTradeSideEnum.BUY}
            symbol={listing?.symbol ?? ''}
            currencySymbol={currencySymbol}
            maxQuantity={null}
            suggestedPrice={suggestedPrice}
            onSubmit={handleSubmit}
        >
            <SecurityPickerRow listing={listing} onChange={setListing} />
        </SecurityTradeForm>
    );
}

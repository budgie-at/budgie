import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { SecuritySearchSection } from '../../../../brokerage/component/security-search-section/security-search-section';
import { SecurityTradeForm } from '../../../../brokerage/component/security-trade-form/security-trade-form';
import { BrokerageService } from '../../../../brokerage/service/brokerage.service';

import type { SecurityTradeFormValues } from '../../../../brokerage/constant/security-trade-form-schema.constant';
import type { YahooListingInterface } from '@budgie/market';

export default function BuySecurity() {
    const { t } = useLingui();
    const integrationId = Number(useLocalSearchParams<IdParamInterface>().id);
    const [query, setQuery] = useState('');
    const [listing, setListing] = useState<YahooListingInterface | null>(null);

    const handleSubmit = (values: SecurityTradeFormValues) =>
        isDefined(listing)
            ? Effect.flatMap(BrokerageService, brokerageService => brokerageService.buy(integrationId, listing, query, values))
            : Effect.void;

    const isReady = isDefined(listing);
    const selectedSymbol = listing?.symbol ?? null;

    return (
        <SecurityTradeForm title={t`Add position`} isReady={isReady} onSubmit={handleSubmit}>
            <SecuritySearchSection query={query} onQueryChange={setQuery} selectedSymbol={selectedSymbol} onSelect={setListing} />
        </SecurityTradeForm>
    );
}

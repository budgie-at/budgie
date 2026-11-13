import { InstrumentTypeEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { RevealGate } from '../../../@generic/component/reveal-gate/reveal-gate';
import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { isListedSecurityType } from '../../../instrument/utils/is-listed-security-type.util';
import { CurrencyMarketPage } from '../../../market-data/component/currency-market-page/currency-market-page';

export default function CurrencyMarketRoute() {
    const params = useLocalSearchParams<IdParamInterface>();
    const id = Number(params.id);
    const { instrument, isLoading } = useGetInstrumentByIdQuery(id);

    if (isLoading) {
        return (
            <GroupedSurface>
                <RevealGate isLoading>{null}</RevealGate>
            </GroupedSurface>
        );
    }

    if (!isDefined(instrument) || (instrument.type !== InstrumentTypeEnum.CRYPTO && !isListedSecurityType(instrument.type))) {
        return <Redirect href="/" />;
    }

    return <CurrencyMarketPage instrument={instrument} />;
}

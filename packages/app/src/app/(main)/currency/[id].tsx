import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { CurrencyMarketPage } from '../../../market-data/component/currency-market-page/currency-market-page';

export default function CurrencyMarketRoute() {
    const params = useLocalSearchParams<IdParamInterface>();
    const id = Number(params.id);
    const { instrument, isLoading } = useGetInstrumentByIdQuery(id);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isDefined(instrument)) {
        return <Redirect href="/" />;
    }

    return <CurrencyMarketPage instrument={instrument} />;
}

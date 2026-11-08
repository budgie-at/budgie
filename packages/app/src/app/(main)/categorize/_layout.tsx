import { useGlobalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { useState } from 'react';

import { ScreenLayout } from '../../../@generic/component/screen-layout/screen-layout';
import { useLockstepStackOptions } from '../../../@generic/hook/use-lockstep-stack-options.hook';
import { normalizeRouteParam } from '../../../@generic/utils/normalize-route-param.util';
import { CategorizeInboxCategoryProvider } from '../../../categorize-inbox/components/categorize-inbox-category-provider/categorize-inbox-category-provider';
import { CategorizeInboxTagProvider } from '../../../categorize-inbox/components/categorize-inbox-tag-provider/categorize-inbox-tag-provider';
import { CategorizeInboxKindEnum } from '../../../categorize-inbox/enum/categorize-inbox-kind.enum';
import { parseAnalyticsTransactionsRouteParams } from '../../../transaction/utils/parse-analytics-transactions-route-params.util';

import type { AnalyticsTransactionsSearchParamsType } from '../../../transaction/type/analytics-transactions-search-params.type';

export default function CategorizeLayout() {
    const searchParams = useGlobalSearchParams<AnalyticsTransactionsSearchParamsType>();
    const [params] = useState(() => parseAnalyticsTransactionsRouteParams(searchParams));
    const [kind] = useState(() => normalizeRouteParam(searchParams.kind));

    const screenOptions = useLockstepStackOptions();

    const stack = <Stack screenOptions={screenOptions} screenLayout={ScreenLayout} />;

    if (kind === CategorizeInboxKindEnum.TAG) {
        return <CategorizeInboxTagProvider params={params}>{stack}</CategorizeInboxTagProvider>;
    }

    return <CategorizeInboxCategoryProvider params={params}>{stack}</CategorizeInboxCategoryProvider>;
}

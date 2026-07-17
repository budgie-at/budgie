import { useLocalSearchParams } from 'expo-router';

import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { parseRuleIdsRouteParam } from '../../utils/parse-rule-ids-route-param.util';
import { RulesListPage } from '../rules-list-page/rules-list-page';

import type { Href } from 'expo-router';

interface Props {
    readonly backRoute: Href;
}

export const RulesListRoute = ({ backRoute }: Props) => {
    const routeParams = useLocalSearchParams<{ readonly ruleIds?: string | string[] }>();
    const matchingRuleIds = parseRuleIdsRouteParam(routeParams.ruleIds);
    const handleGoBack = () => void goBackOrReplace(backRoute);

    return <RulesListPage matchingRuleIds={matchingRuleIds} onGoBack={handleGoBack} />;
};

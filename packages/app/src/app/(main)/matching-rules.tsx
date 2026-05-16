import { useLocalSearchParams } from 'expo-router';

import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { RulesListPage } from '../../rule/components/rules-list-page/rules-list-page';
import { parseRuleIdsRouteParam } from '../../rule/utils/parse-rule-ids-route-param.util';

const handleGoBack = () => void goBackOrReplace('/');

export default function MatchingRulesPage() {
    const routeParams = useLocalSearchParams();
    const matchingRuleIds = parseRuleIdsRouteParam(routeParams.ruleIds);

    return <RulesListPage matchingRuleIds={matchingRuleIds} onGoBack={handleGoBack} />;
}

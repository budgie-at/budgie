import { RuleConditionFieldEnum } from '@budgie/contracts';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { SuggestRuleApplyModalContent } from '../../rule/components/suggest-rule-apply-modal-content/suggest-rule-apply-modal-content';
import { DEFAULT_SUGGEST_RULE_DATA } from '../../rule/constant/default-suggest-rule-data.constant';
import { useSuggestRuleModal } from '../../rule/context/suggest-rule-modal.context';

type SuggestRuleConditionField = RuleConditionFieldEnum.TITLE | RuleConditionFieldEnum.COMMENT | RuleConditionFieldEnum.MCC_CODE;

export default function SuggestRuleApplyRoute() {
    const router = useRouter();
    const { currentParams, resolveSuggestRule } = useSuggestRuleModal();
    const { selectedFields: selectedFieldsParam } = useLocalSearchParams<{ selectedFields: string }>();

    const selectedFields = JSON.parse(selectedFieldsParam) as SuggestRuleConditionField[];

    const handleCreateRule = () => {
        resolveSuggestRule('created');
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <SuggestRuleApplyModalContent
            suggestRuleData={currentParams?.suggestRuleData ?? DEFAULT_SUGGEST_RULE_DATA}
            selectedFields={selectedFields}
            onCreateRule={handleCreateRule}
            onBack={handleBack}
        />
    );
}

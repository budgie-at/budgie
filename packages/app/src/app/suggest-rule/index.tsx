import { RuleConditionFieldEnum } from '@budgie/contracts';
import { useRouter } from 'expo-router';

import { SuggestRuleModalContent } from '../../rule/components/suggest-rule-modal-content/suggest-rule-modal-content';
import { DEFAULT_SUGGEST_RULE_DATA } from '../../rule/constant/default-suggest-rule-data.constant';
import { useSuggestRuleModal } from '../../rule/context/suggest-rule-modal.context';

type SuggestRuleConditionField = RuleConditionFieldEnum.TITLE | RuleConditionFieldEnum.COMMENT | RuleConditionFieldEnum.MCC_CODE;

export default function SuggestRuleRoute() {
    const router = useRouter();
    const { currentParams, resolveSuggestRule } = useSuggestRuleModal();

    const handleDismiss = () => {
        resolveSuggestRule('dismissed');
    };

    const handleNext = (selectedFields: SuggestRuleConditionField[]) => {
        router.push({ pathname: '/suggest-rule/apply', params: { selectedFields: JSON.stringify(selectedFields) } });
    };

    return (
        <SuggestRuleModalContent
            suggestRuleData={currentParams?.suggestRuleData ?? DEFAULT_SUGGEST_RULE_DATA}
            onDismiss={handleDismiss}
            onNext={handleNext}
        />
    );
}

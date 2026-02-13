import { SuggestRuleModalContent } from '../rule/components/suggest-rule-modal-content/suggest-rule-modal-content';
import { useSuggestRuleModal } from '../rule/context/suggest-rule-modal.context';
import { SuggestRuleDataInterface } from '../rule/interface/suggest-rule-data.interface';

const DEFAULT_SUGGEST_RULE_DATA: SuggestRuleDataInterface = {
    title: '',
    comment: '',
    mccCode: null,
    categoryId: null,
    tagIds: []
};

export default function SuggestRuleModal() {
    const { currentParams, resolveSuggestRule } = useSuggestRuleModal();

    const handleCreateRule = () => {
        resolveSuggestRule('created');
    };

    const handleDismiss = () => {
        resolveSuggestRule('dismissed');
    };

    return (
        <SuggestRuleModalContent
            suggestRuleData={currentParams?.suggestRuleData ?? DEFAULT_SUGGEST_RULE_DATA}
            onCreateRule={handleCreateRule}
            onDismiss={handleDismiss}
        />
    );
}

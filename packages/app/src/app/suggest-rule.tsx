import { SuggestRuleBottomSheet } from '../rule/components/suggest-rule-bottom-sheet/suggest-rule-bottom-sheet';
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
        <SuggestRuleBottomSheet
            suggestRuleData={currentParams?.suggestRuleData ?? DEFAULT_SUGGEST_RULE_DATA}
            onCreateRule={handleCreateRule}
            onDismiss={handleDismiss}
        />
    );
}

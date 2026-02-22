import { View } from 'react-native';

import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { SuggestRuleModalContent } from '../rule/components/suggest-rule-modal-content/suggest-rule-modal-content';
import { DEFAULT_SUGGEST_RULE_DATA } from '../rule/constant/default-suggest-rule-data.constant';
import { useSuggestRuleModal } from '../rule/context/suggest-rule-modal.context';

export default function SuggestRuleRoute() {
    const { currentParams, resolveSuggestRule } = useSuggestRuleModal();
    const { backgroundColor } = useFormsheetListStyles();

    const containerStyle = { flex: 1, backgroundColor };

    const handleDismiss = () => {
        resolveSuggestRule('dismissed');
    };

    const handleCreateRule = () => {
        resolveSuggestRule('created');
    };

    return (
        <View style={containerStyle}>
            <SuggestRuleModalContent
                suggestRuleData={currentParams?.suggestRuleData ?? DEFAULT_SUGGEST_RULE_DATA}
                onDismiss={handleDismiss}
                onCreateRule={handleCreateRule}
            />
        </View>
    );
}

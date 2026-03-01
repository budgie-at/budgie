import { Dimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SHEET_DETENT } from '../@generic/constant/suggest-rule-modal-options.constant';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { SuggestRuleModalContent } from '../rule/components/suggest-rule-modal-content/suggest-rule-modal-content';
import { DEFAULT_SUGGEST_RULE_DATA } from '../rule/constant/default-suggest-rule-data.constant';
import { useSuggestRuleModal } from '../rule/context/suggest-rule-modal.context';

const MODAL_HEIGHT = Dimensions.get('window').height * SHEET_DETENT;

export default function SuggestRuleRoute() {
    const [, resolveSuggestRule, currentParams] = useSuggestRuleModal();
    const { backgroundColor } = useFormsheetListStyles();
    const { bottom } = useSafeAreaInsets();

    const containerStyle = { height: MODAL_HEIGHT, paddingBottom: bottom, backgroundColor };

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

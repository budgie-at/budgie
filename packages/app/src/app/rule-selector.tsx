import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { RuleSelectorModalContent } from '../rule/components/rule-selector-modal-content/rule-selector-modal-content';

export default function RuleSelectorModal() {
    const { params: currentParams, resolve: resolveRuleSelector } = useModalRoute('/rule-selector');
    const { handleCommit, handleDismissed } = useMorphingSheetResult<string>(resolveRuleSelector);
    const options = currentParams?.options ?? [];
    const selectedValue = currentParams?.selectedValue ?? null;

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <RuleSelectorModalContent
                title={currentParams?.title ?? ''}
                options={options}
                selectedValue={selectedValue}
                onCommit={handleCommit}
            />
        </SingleStepMorphingSheet>
    );
}

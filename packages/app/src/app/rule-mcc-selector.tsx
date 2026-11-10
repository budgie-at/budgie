import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { RuleMccSelectorModalContent } from '../rule/components/rule-mcc-selector-modal-content/rule-mcc-selector-modal-content';

export default function RuleMccSelectorModal() {
    const { params: currentParams, resolve: resolveRuleMccSelector } = useModalRoute('/rule-mcc-selector');
    const selectedMcc = currentParams?.selectedMcc ?? null;
    const { handleCommit, handleDismissed } = useMorphingSheetResult<string>(resolveRuleMccSelector);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <RuleMccSelectorModalContent selectedMcc={selectedMcc} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}

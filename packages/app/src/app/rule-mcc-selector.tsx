import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { RuleMccSelectorModalContent } from '../rule/components/rule-mcc-selector-modal-content/rule-mcc-selector-modal-content';
import { useRuleMccSelectorModal, useRuleMccSelectorModalParams } from '../rule/context/rule-mcc-selector-modal.context';

export default function RuleMccSelectorModal() {
    const [, resolveRuleMccSelector, dismissRuleMccSelector] = useRuleMccSelectorModal();
    useModalDismiss(dismissRuleMccSelector);
    const currentParams = useRuleMccSelectorModalParams();
    const selectedMcc = currentParams?.selectedMcc ?? null;
    const { handleCommit, handleDismissed } = useMorphingSheetResult<string>(resolveRuleMccSelector);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed} isContentDraggable={false}>
            <RuleMccSelectorModalContent selectedMcc={selectedMcc} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}

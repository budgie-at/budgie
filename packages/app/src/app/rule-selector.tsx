import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { RuleSelectorModalContent } from '../rule/components/rule-selector-modal-content/rule-selector-modal-content';
import { useRuleSelectorModal, useRuleSelectorModalParams } from '../rule/context/rule-selector-modal.context';

export default function RuleSelectorModal() {
    const [, resolveRuleSelector, dismissRuleSelector] = useRuleSelectorModal();
    useModalDismiss(dismissRuleSelector);
    const currentParams = useRuleSelectorModalParams();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<string>(resolveRuleSelector);
    const options = currentParams?.options ?? [];
    const selectedValue = currentParams?.selectedValue ?? null;

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed} isContentDraggable={false}>
            <RuleSelectorModalContent
                title={currentParams?.title ?? ''}
                options={options}
                selectedValue={selectedValue}
                onCommit={handleCommit}
            />
        </SingleStepMorphingSheet>
    );
}

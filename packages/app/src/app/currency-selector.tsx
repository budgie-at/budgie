import { InstrumentTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { CurrencySelectorModalContent } from '../@generic/component/currency-selector-modal-content/currency-selector-modal-content';
import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useCurrencySelectorModal, useCurrencySelectorModalParams } from '../@generic/context/currency-selector-modal.context';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';

export default function CurrencySelectorModal() {
    const [, resolveCurrencySelector, dismissCurrencySelector] = useCurrencySelectorModal();
    useModalDismiss(dismissCurrencySelector);
    const currentParams = useCurrencySelectorModalParams();
    const instrumentType = isDefined(currentParams?.instrumentType) ? currentParams.instrumentType : InstrumentTypeEnum.FIAT;
    const selectedInstrumentId = currentParams?.selectedInstrumentId;
    const contentKey = `${instrumentType}:${selectedInstrumentId ?? 0}`;
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number>(resolveCurrencySelector);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed} isContentDraggable={false}>
            <CurrencySelectorModalContent
                key={contentKey}
                instrumentType={instrumentType}
                selectedInstrumentId={selectedInstrumentId}
                onCommit={handleCommit}
            />
        </SingleStepMorphingSheet>
    );
}

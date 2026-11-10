import { InstrumentTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { CurrencySelectorModalContent } from '../@generic/component/currency-selector-modal-content/currency-selector-modal-content';
import { SelectorMorphingSurface } from '../@generic/component/selector-morphing-surface/selector-morphing-surface';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../@generic/constant/morphing-sheet-height-ratio.constant';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetListHeight } from '../@generic/hook/use-morphing-sheet-list-height.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';

export default function CurrencySelectorModal() {
    const { params: currentParams, resolve: resolveCurrencySelector } = useModalRoute('/currency-selector');
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const instrumentType = isDefined(currentParams?.instrumentType) ? currentParams.instrumentType : InstrumentTypeEnum.FIAT;
    const selectedInstrumentId = currentParams?.selectedInstrumentId;
    const contentKey = `${instrumentType}:${selectedInstrumentId ?? 0}`;
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number>(resolveCurrencySelector);

    return (
        <SelectorMorphingSurface origin={currentParams?.origin} onDismissed={handleDismissed} sheetStyle={listStyle}>
            <CurrencySelectorModalContent
                key={contentKey}
                instrumentType={instrumentType}
                selectedInstrumentId={selectedInstrumentId}
                onCommit={handleCommit}
                isSearchAutoFocused={isDefined(currentParams?.origin)}
            />
        </SelectorMorphingSurface>
    );
}

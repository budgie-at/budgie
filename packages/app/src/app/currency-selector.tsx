import { InstrumentTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { CurrencySelectorModalContent } from '../@generic/component/currency-selector-modal-content/currency-selector-modal-content';
import { useCurrencySelectorModal, useCurrencySelectorModalParams } from '../@generic/context/currency-selector-modal.context';

export default function CurrencySelectorModal() {
    const [, resolveCurrencySelector] = useCurrencySelectorModal();
    const currentParams = useCurrencySelectorModalParams();
    const instrumentType = isDefined(currentParams?.instrumentType) ? currentParams.instrumentType : InstrumentTypeEnum.FIAT;
    const selectedInstrumentId = currentParams?.selectedInstrumentId;
    const contentKey = `${instrumentType}:${selectedInstrumentId ?? 0}`;

    const handleSelect = (instrumentId: number) => {
        resolveCurrencySelector(instrumentId);
    };

    return (
        <CurrencySelectorModalContent
            key={contentKey}
            instrumentType={instrumentType}
            selectedInstrumentId={selectedInstrumentId}
            onSelect={handleSelect}
        />
    );
}

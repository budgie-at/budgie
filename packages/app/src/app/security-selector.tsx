import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { SecuritySelectorModalContent } from '../brokerage/component/security-selector-modal-content/security-selector-modal-content';

import type { YahooListingInterface } from '@budgie/market';

export default function SecuritySelectorModal() {
    const { params: modalParams, resolve: resolveSecuritySelector } = useModalRoute('/security-selector');
    const { handleCommit, handleDismissed } = useMorphingSheetResult<YahooListingInterface>(resolveSecuritySelector);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <SecuritySelectorModalContent selectedSymbol={modalParams?.selectedSymbol ?? null} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}

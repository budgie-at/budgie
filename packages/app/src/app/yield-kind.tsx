import { isDefined } from '@rnw-community/shared';

import { SelectorMorphingSurface } from '../@generic/component/selector-morphing-surface/selector-morphing-surface';
import { AnchoredMorphPanelHeightEnum } from '../@generic/enum/anchored-morph-panel-height.enum';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { YieldKindSelectorContent } from '../yield/component/yield-kind-selector-content/yield-kind-selector-content';

import type { YieldKindEnum } from '@budgie/contracts';

export default function YieldKindModal() {
    const { params, resolve } = useModalRoute('/yield-kind');
    const { handleCommit, handleDismissed } = useMorphingSheetResult<YieldKindEnum>(resolve);

    if (!isDefined(params)) {
        return null;
    }

    return (
        <SelectorMorphingSurface origin={params.origin} onDismissed={handleDismissed} panelHeight={AnchoredMorphPanelHeightEnum.CONTENT}>
            <YieldKindSelectorContent params={params} onCommit={handleCommit} />
        </SelectorMorphingSurface>
    );
}

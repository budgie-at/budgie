import { SelectorMorphingSurface } from '../@generic/component/selector-morphing-surface/selector-morphing-surface';
import { AnchoredMorphPanelHeightEnum } from '../@generic/enum/anchored-morph-panel-height.enum';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { LanguageSelectorModalContent } from '../i18n/components/language-selector-modal-content/language-selector-modal-content';

import type { LanguageEnum } from '@budgie/contracts';

export default function LanguageSelectorModal() {
    const { params: currentParams, resolve: resolveLanguageSelector } = useModalRoute('/language-selector');
    const { handleCommit, handleDismissed } = useMorphingSheetResult<LanguageEnum>(resolveLanguageSelector);

    return (
        <SelectorMorphingSurface
            origin={currentParams?.origin}
            onDismissed={handleDismissed}
            panelHeight={AnchoredMorphPanelHeightEnum.CONTENT}
        >
            <LanguageSelectorModalContent selectedLanguage={currentParams?.selectedLanguage} onCommit={handleCommit} />
        </SelectorMorphingSurface>
    );
}

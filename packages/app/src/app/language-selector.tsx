import { SelectorMorphingSurface } from '../@generic/component/selector-morphing-surface/selector-morphing-surface';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { LanguageSelectorModalContent } from '../i18n/components/language-selector-modal-content/language-selector-modal-content';
import { useLanguageSelectorModal, useLanguageSelectorModalParams } from '../i18n/context/language-selector-modal.context';

import type { LanguageEnum } from '@budgie/contracts';

export default function LanguageSelectorModal() {
    const [, resolveLanguageSelector, dismissLanguageSelector] = useLanguageSelectorModal();
    useModalDismiss(dismissLanguageSelector);
    const currentParams = useLanguageSelectorModalParams();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<LanguageEnum>(resolveLanguageSelector);

    return (
        <SelectorMorphingSurface origin={currentParams?.origin} onDismissed={handleDismissed}>
            <LanguageSelectorModalContent selectedLanguage={currentParams?.selectedLanguage} onCommit={handleCommit} />
        </SelectorMorphingSurface>
    );
}

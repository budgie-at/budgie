import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { LanguageSelectorModalContent } from '../i18n/components/language-selector-modal-content/language-selector-modal-content';
import { useLanguageSelectorModal, useLanguageSelectorModalParams } from '../i18n/context/language-selector-modal.context';

import type { LanguageEnum } from '@budgie/contracts';

export default function LanguageSelectorModal() {
    const [, resolveLanguageSelector, dismissLanguageSelector] = useLanguageSelectorModal();
    useModalDismiss(dismissLanguageSelector);
    const selectedLanguage = useLanguageSelectorModalParams()?.selectedLanguage;
    const { handleCommit, handleDismissed } = useMorphingSheetResult<LanguageEnum>(resolveLanguageSelector);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed} isContentDraggable={false}>
            <LanguageSelectorModalContent selectedLanguage={selectedLanguage} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}

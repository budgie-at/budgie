import { ContactSelectorModalContent } from '../@generic/component/contact-selector-modal-content/contact-selector-modal-content';
import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';

import type { Contact } from '../@generic/hook/use-contacts.hook';

export default function ContactSelectorModal() {
    const { params: modalParams, resolve: resolveContactSelector } = useModalRoute('/contact-selector');
    const selectedContactId = modalParams?.selectedContactId;
    const { handleCommit, handleDismissed } = useMorphingSheetResult<Contact>(resolveContactSelector);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <ContactSelectorModalContent selectedContactId={selectedContactId} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}

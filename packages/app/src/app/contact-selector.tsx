import { ContactSelectorModalContent } from '../@generic/component/contact-selector-modal-content/contact-selector-modal-content';
import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useContactSelectorModal, useContactSelectorModalParams } from '../@generic/context/contact-selector-modal.context';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';

import type { Contact } from '../@generic/hook/use-contacts.hook';

export default function ContactSelectorModal() {
    const [, resolveContactSelector, dismissContactSelector] = useContactSelectorModal();
    useModalDismiss(dismissContactSelector);
    const selectedContactId = useContactSelectorModalParams()?.selectedContactId;
    const { handleCommit, handleDismissed } = useMorphingSheetResult<Contact>(resolveContactSelector);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <ContactSelectorModalContent selectedContactId={selectedContactId} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { ImportColumnMapperModalContent } from '../import/components/import-column-mapper-modal-content/import-column-mapper-modal-content';
import { useImportColumnMapperModal, useImportColumnMapperModalParams } from '../import/context/import-column-mapper-modal.context';

import type { ImportColumnMapperResult } from '../import/context/import-column-mapper-modal.context';

export default function ImportColumnMapperModal() {
    const [, resolveImportColumnMapper, dismissImportColumnMapper] = useImportColumnMapperModal();
    useModalDismiss(dismissImportColumnMapper);
    const currentParams = useImportColumnMapperModalParams();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<ImportColumnMapperResult>(resolveImportColumnMapper);

    const { samples = {}, headers = [], selectedHeaders = [], currentValue, fieldLabel = '', isRequired = false } = currentParams ?? {};

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed} isContentDraggable={false}>
            <ImportColumnMapperModalContent
                samples={samples}
                headers={headers}
                selectedHeaders={selectedHeaders}
                currentValue={currentValue}
                fieldLabel={fieldLabel}
                isRequired={isRequired}
                onCommit={handleCommit}
            />
        </SingleStepMorphingSheet>
    );
}

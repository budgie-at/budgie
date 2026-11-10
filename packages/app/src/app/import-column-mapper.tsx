import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { ImportColumnMapperModalContent } from '../import/components/import-column-mapper-modal-content/import-column-mapper-modal-content';

import type { ModalResult } from '../@generic/type/modal-result.type';

export default function ImportColumnMapperModal() {
    const { params: currentParams, resolve: resolveImportColumnMapper } = useModalRoute('/import-column-mapper');
    const { handleCommit, handleDismissed } = useMorphingSheetResult<ModalResult<'/import-column-mapper'> | null>(
        resolveImportColumnMapper
    );

    const { samples = {}, headers = [], selectedHeaders = [], currentValue, fieldLabel = '', isRequired = false } = currentParams ?? {};

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
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

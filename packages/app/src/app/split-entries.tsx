import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { FormSheetSpacer } from '../@generic/component/form-sheet-spacer/form-sheet-spacer';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { SplitEntriesModalContent } from '../transaction/components/split-entries-modal-content/split-entries-modal-content';
import { useSplitEntriesModal } from '../transaction/context/split-entries-modal.context';

import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export default function SplitEntriesModal() {
    const { currentParams, resolveSplitEntries } = useSplitEntriesModal();
    const { backgroundColor } = useFormsheetListStyles();

    const containerStyle = { flex: 1, backgroundColor };

    const entriesRef = useRef<TransactionEntryCreateInputInterface[]>(currentParams?.entries ?? []);

    const handleEntriesChange = (entries: TransactionEntryCreateInputInterface[]) => {
        entriesRef.current = entries;
    };

    useEffect(
        () => () => {
            resolveSplitEntries(entriesRef.current, { skipBack: true });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Resolve on unmount only
        []
    );

    if (!currentParams) {
        return null;
    }

    return (
        <View style={containerStyle}>
            <SplitEntriesModalContent
                initialEntries={currentParams.entries}
                variant={currentParams.variant}
                entryType={currentParams.entryType}
                currencySymbol={currentParams.currencySymbol}
                onEntriesChange={handleEntriesChange}
            />
            <FormSheetSpacer />
        </View>
    );
}

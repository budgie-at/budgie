import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { SplitEntriesModalContent } from '../transaction/components/split-entries-modal-content/split-entries-modal-content';
import { useSplitEntriesModal } from '../transaction/context/split-entries-modal.context';

import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export default function SplitEntriesModal() {
    const router = useRouter();
    const [, resolveSplitEntries, currentParams] = useSplitEntriesModal();
    const { backgroundColor } = useFormsheetListStyles();

    const screenOptions = { contentStyle: { backgroundColor } };
    const containerStyle = { flex: 1, backgroundColor };

    const entriesRef = useRef<TransactionEntryCreateInputInterface[]>(currentParams?.entries ?? []);

    const handleEntriesChange = (entries: TransactionEntryCreateInputInterface[]) => {
        entriesRef.current = entries;
    };

    const handleConfirm = () => {
        resolveSplitEntries(entriesRef.current);
    };

    useEffect(
        () => () => {
            resolveSplitEntries(null, { skipBack: true });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Resolve on unmount only
        []
    );

    useEffect(() => {
        if (!currentParams) {
            router.back();
        }
    }, [currentParams, router]);

    if (!currentParams) {
        return null;
    }

    return (
        <View style={containerStyle} collapsable={false}>
            <Stack.Screen options={screenOptions} />
            <SplitEntriesModalContent
                initialEntries={currentParams.entries}
                variant={currentParams.variant}
                entryType={currentParams.entryType}
                currencySymbol={currentParams.currencySymbol}
                totalAmount={currentParams.totalAmount}
                onEntriesChange={handleEntriesChange}
                onConfirm={handleConfirm}
            />
        </View>
    );
}

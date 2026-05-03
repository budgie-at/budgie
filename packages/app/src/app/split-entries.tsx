import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { SplitEntriesModalContent } from '../transaction/components/split-entries-modal-content/split-entries-modal-content';
import { useSplitEntriesModal } from '../transaction/context/split-entries-modal.context';

import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export default function SplitEntriesModal() {
    const router = useRouter();
    const [, resolveSplitEntries, currentParams] = useSplitEntriesModal();
    const { backgroundColor } = useFormsheetListStyles();
    const hadParamsRef = useRef(isDefined(currentParams));

    const screenOptions = { contentStyle: { backgroundColor } };
    const containerStyle = { flex: 1, backgroundColor };

    const handleConfirm = (entries: TransactionEntryCreateInputInterface[]) => {
        resolveSplitEntries(entries);
    };

    useEffect(
        () => () => {
            resolveSplitEntries(null, { skipBack: true });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Resolve on unmount only
        []
    );

    useEffect(() => {
        if (isDefined(currentParams)) {
            hadParamsRef.current = true;

            return;
        }

        if (!hadParamsRef.current) {
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
                onConfirm={handleConfirm}
            />
        </View>
    );
}

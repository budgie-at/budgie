import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { ConsolidationSourceModalContent } from '../transaction/components/consolidation-source-modal-content/consolidation-source-modal-content';
import { useConsolidationSourceModal } from '../transaction/context/consolidation-source-modal.context';

/* jscpd:ignore-start */
export default function ConsolidationSourceModal() {
    const router = useRouter();
    const [, resolveConsolidationSource, currentParams] = useConsolidationSourceModal();
    const { backgroundColor } = useFormsheetListStyles();

    const screenOptions = { contentStyle: { backgroundColor } };
    const containerStyle = { flex: 1, backgroundColor };

    const handleClose = () => {
        resolveConsolidationSource(null);
    };

    useEffect(
        () => () => {
            resolveConsolidationSource(null, { skipBack: true });
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
            <ConsolidationSourceModalContent transactionId={currentParams.transactionId} onClose={handleClose} />
        </View>
    );
}
/* jscpd:ignore-end */

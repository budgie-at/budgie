import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { dismissAllOrReplace } from '../@generic/utils/dismiss-all-or-replace.util';
import { ConsolidationSourceModalContent } from '../transaction/components/consolidation-source-modal-content/consolidation-source-modal-content';
import { useConsolidationSourceModal } from '../transaction/context/consolidation-source-modal.context';

/* jscpd:ignore-start */
export default function ConsolidationSourceModal() {
    const router = useRouter();
    const [, resolveConsolidationSource, currentParams] = useConsolidationSourceModal();
    const hadParamsRef = useRef(false);
    const { backgroundColor } = useFormsheetListStyles();

    const screenOptions = { contentStyle: { backgroundColor } };
    const containerStyle = { backgroundColor };

    const handleClose = () => {
        resolveConsolidationSource(null);
    };

    const handleRevertSuccess = () => {
        resolveConsolidationSource(null, { skipBack: true });
        dismissAllOrReplace('/');
    };

    useEffect(
        () => () => {
            resolveConsolidationSource(null, { skipBack: true });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Resolve on unmount only
        []
    );

    useEffect(() => {
        if (currentParams) {
            hadParamsRef.current = true;
        }

        if (!currentParams && !hadParamsRef.current && router.canGoBack()) {
            router.back();
        }
    }, [currentParams, router]);

    if (!currentParams) {
        return null;
    }

    return (
        <View style={containerStyle} collapsable={false}>
            <Stack.Screen options={screenOptions} />
            <ConsolidationSourceModalContent
                transactionId={currentParams.transactionId}
                onClose={handleClose}
                onRevertSuccess={handleRevertSuccess}
            />
        </View>
    );
}
/* jscpd:ignore-end */

import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { TransactionFeeModalContent } from '../transaction/components/transaction-fee-modal-content/transaction-fee-modal-content';
import { useTransactionFeeModal } from '../transaction/context/transaction-fee-modal.context';

import type { TransactionFeeModalResult } from '../transaction/context/transaction-fee-modal.context';

export default function TransactionFeeModal() {
    const router = useRouter();
    const [, resolveTransactionFee, currentParams] = useTransactionFeeModal();
    const { backgroundColor } = useFormsheetListStyles();
    const hadParamsRef = useRef(isDefined(currentParams));

    const screenOptions = { contentStyle: { backgroundColor } };
    const containerStyle = { flex: 1, backgroundColor };

    const handleConfirm = (result: TransactionFeeModalResult) => {
        resolveTransactionFee(result);
    };

    useEffect(
        () => () => {
            resolveTransactionFee(null, { skipBack: true });
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
            <TransactionFeeModalContent
                accountId={currentParams.accountId}
                currencySymbol={currentParams.currencySymbol}
                entry={currentParams.entry}
                variant={currentParams.variant}
                onConfirm={handleConfirm}
            />
        </View>
    );
}

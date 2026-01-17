import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { RefObject, useRef, useState } from 'react';
import { Text } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { AccountSelectorBottomSheet } from '../../../account/component/account-selector-bottom-sheet/account-selector-bottom-sheet';
import { useAccountSelector } from '../../../account/hooks/use-account-selector.hook';
import { useConvertExpenseToTransferMutation } from '../../hooks/use-convert-expense-to-transfer.mutation';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly transactionId: number;
    readonly fromAccountId: number;
    readonly onSuccess: () => void;
}

export const ConvertExpenseToTransferBottomSheet = (props: Props) => {
    const { ref, transactionId, fromAccountId, onSuccess } = props;

    const { t } = useLingui();

    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const accountSheetRef = useRef<BottomSheetInterface | null>(null);

    const convertMutation = useConvertExpenseToTransferMutation();
    const { selectedAccount, icon } = useAccountSelector({ accountId: selectedAccountId });

    const handleConvert = async () => {
        if (!isDefined(selectedAccountId)) {
            return;
        }
        setIsLoading(true);
        try {
            await convertMutation(transactionId, selectedAccountId);
            onSuccess();
            ref.current?.close();
        } catch {
            Toast.show({ type: 'error', text1: t`Conversion failed`, text2: t`Please try again` });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenAccountSheet = () => void accountSheetRef.current?.open();

    return (
        <>
            <ConfirmActionBottomSheet
                ref={ref}
                variant="default"
                icon={UserIconNameEnum.ArrowRightLeft}
                title={t`Convert to Transfer?`}
                description={t`Select the destination account for this transfer.`}
                buttonText={t`Convert to Transfer`}
                isDisabled={!isDefined(selectedAccountId)}
                isLoading={isLoading}
                onSubmit={handleConvert}
            >
                <HapticPressable onPress={handleOpenAccountSheet} className="mb-3xl">
                    <Card className="flex-row items-center gap-x-lg p-lg">
                        <CircleIcon icon={icon} variant="ghost" size={34} iconSize={18} />
                        <Text className="flex-1 text-primary text-base font-medium">
                            {isDefined(selectedAccount) ? selectedAccount.title : <Trans>Select Account</Trans>}
                        </Text>
                        <CircleIcon icon={UserIconNameEnum.ChevronRight} variant="ghost" size={20} iconSize={16} />
                    </Card>
                </HapticPressable>
            </ConfirmActionBottomSheet>
            <AccountSelectorBottomSheet
                selectedAccount={selectedAccount}
                excludeAccountId={fromAccountId}
                onSelect={setSelectedAccountId}
                ref={accountSheetRef}
            />
        </>
    );
};

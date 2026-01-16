import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { RefObject, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetView } from '../../../@generic/component/bottom-sheet-view/bottom-sheet-view';
import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { DETACHED_BOTTOM_SHEET_BORDER_PALETTE } from '../../../@generic/constant/detached-bottom-sheet-border-palette.constant';
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

const cardVariants = cva('mx-5xl rounded-5xl overflow-hidden border-2 shadow-[0px_0px_15px_-8px]', {
    variants: { variant: DETACHED_BOTTOM_SHEET_BORDER_PALETTE }
});

export const ConvertExpenseToTransferBottomSheet = (props: Props) => {
    const { ref, transactionId, fromAccountId, onSuccess } = props;

    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();

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

    const handleCancel = () => void ref.current?.close();
    const handleOpenAccountSheet = () => void accountSheetRef.current?.open();

    const isConvertDisabled = !isDefined(selectedAccountId) || isLoading;
    const submitButtonContent = isLoading ? <ActivityIndicator size="small" /> : t`Convert to Transfer`;

    return (
        <>
            <BottomSheet
                className={cardVariants({ variant: 'default' })}
                ref={ref}
                enableDynamicSizing
                bottomInset={bottom}
                isCloseable={false}
                detached
            >
                <BottomSheetView className="mx-5 bg-transparent pt-xl pb-5xl">
                    <CircleIcon
                        icon={UserIconNameEnum.ArrowRightLeft}
                        variant="default"
                        size={50}
                        iconSize={24}
                        className="mb-4xl self-center rounded-3xl"
                    />
                    <Text className="text-primary text-xl font-semibold text-center mb-sm">
                        <Trans>Convert to Transfer?</Trans>
                    </Text>
                    <Text className="text-secondary-foreground text-center text-sm mb-3xl">
                        <Trans>Select the destination account for this transfer.</Trans>
                    </Text>
                    <HapticPressable onPress={handleOpenAccountSheet} className="mb-3xl">
                        <Card className="flex-row items-center gap-x-lg p-lg">
                            <CircleIcon icon={icon} variant="ghost" size={34} iconSize={18} />
                            <Text className="flex-1 text-primary text-base font-medium">
                                {isDefined(selectedAccount) ? selectedAccount.title : <Trans>Select Account</Trans>}
                            </Text>
                            <CircleIcon icon={UserIconNameEnum.ChevronRight} variant="ghost" size={20} iconSize={16} />
                        </Card>
                    </HapticPressable>
                    <View className="gap-y-md">
                        <Button
                            content={submitButtonContent}
                            disabled={isConvertDisabled}
                            onPress={handleConvert}
                            variant="solid-default"
                            size="md"
                        />
                        <Button onPress={handleCancel} content={t`Cancel`} variant="ghost" disabled={isLoading} />
                    </View>
                </BottomSheetView>
            </BottomSheet>
            <AccountSelectorBottomSheet
                selectedAccount={selectedAccount}
                excludeAccountId={fromAccountId}
                onSelect={setSelectedAccountId}
                ref={accountSheetRef}
            />
        </>
    );
};

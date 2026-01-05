import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { forwardRef, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useAccountSelector } from '../../../account/hooks/use-account-selector.hook';
import { useConvertExpenseToTransferMutation } from '../../hooks/use-convert-expense-to-transfer.mutation';

interface Props {
    readonly transactionId: number;
    readonly fromAccountId: number;
    readonly onSuccess: () => void;
}

const BOTTOM_SHEET_SNAP_POINTS = [500];

 
export const ConvertExpenseToTransferBottomSheet = forwardRef<BottomSheetInterface, Props>(
    // eslint-disable-next-line max-lines-per-function
    ({ transactionId, fromAccountId, onSuccess }, ref) => {
        const { t } = useLingui();
        const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
        const [isLoading, setIsLoading] = useState(false);
        const accountSheetRef = useRef<BottomSheetInterface | null>(null);

        const convertMutation = useConvertExpenseToTransferMutation();
        const { selectedAccount, icon, renderBottomSheet } = useAccountSelector({
            accountId: selectedAccountId,
            onSelect: setSelectedAccountId,
            excludeAccountId: fromAccountId
        });

        const handleConvert = async () => {
            if (!isDefined(selectedAccountId)) {
                return;
            }

            setIsLoading(true);

            try {
                await convertMutation(transactionId, selectedAccountId);
                onSuccess();
                if (ref && typeof ref !== 'function' && ref.current) {
                    ref.current.close();
                }
            } catch {
                Toast.show({
                    type: 'error',
                    text1: t`Conversion failed`,
                    text2: t`Please try again`
                });
            } finally {
                setIsLoading(false);
            }
        };

        const handleClose = () => {
            if (ref && typeof ref !== 'function' && ref.current) {
                ref.current.close();
            }
        };

        const handleOpenAccountSheet = () => void accountSheetRef.current?.open();

        const canConvert = isDefined(selectedAccountId);
        const isConvertDisabled = !canConvert || isLoading;

        return (
            <>
                <BottomSheet ref={ref} detached snapPoints={BOTTOM_SHEET_SNAP_POINTS}>
                    <View className="p-5xl gap-y-4xl">
                        <CircleIcon
                            icon={UserIconNameEnum.Info}
                            variant="default"
                            size={50}
                            iconSize={24}
                            className="self-center"
                        />

                        <Text className="text-primary text-xl font-semibold text-center">
                            <Trans>Convert to Transfer?</Trans>
                        </Text>

                        <Text className="text-secondary-foreground text-center text-sm">
                            <Trans>
                                This will change the transaction type. The category will be replaced with &apos;Currency
                                Transfer&apos;.
                            </Trans>
                        </Text>

                        <View className="gap-y-xs">
                            <Text className="text-sm text-secondary-foreground">
                                <Trans>Destination Account</Trans>
                            </Text>
                            <HapticPressable onPress={handleOpenAccountSheet}>
                                <Card className="flex-row items-center gap-x-lg p-lg">
                                    <CircleIcon icon={icon} variant="ghost" size={34} iconSize={18} />
                                    <Text className="flex-1 text-primary text-base font-medium">
                                        {isDefined(selectedAccount) ? selectedAccount.title : <Trans>Select Account</Trans>}
                                    </Text>
                                    <CircleIcon
                                        icon={UserIconNameEnum.ChevronRight}
                                        variant="ghost"
                                        size={20}
                                        iconSize={16}
                                    />
                                </Card>
                            </HapticPressable>
                        </View>

                        <View className="flex-row gap-x-lg">
                            <Button
                                content={<Trans>Cancel</Trans>}
                                variant="ghost"
                                onPress={handleClose}
                                className="flex-1"
                            />
                            <Button
                                content={<Trans>Convert</Trans>}
                                variant="default"
                                disabled={isConvertDisabled}
                                onPress={handleConvert}
                                className="flex-1"
                            />
                        </View>
                    </View>
                </BottomSheet>
                {renderBottomSheet(accountSheetRef)}
            </>
        );
    }
);

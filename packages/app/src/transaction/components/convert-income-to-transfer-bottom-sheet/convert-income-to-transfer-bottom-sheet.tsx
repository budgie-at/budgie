/* jscpd:ignore-start */
import { UserIconNameEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetView } from '../../../@generic/component/bottom-sheet-view/bottom-sheet-view';
import { Button } from '../../../@generic/component/button/button';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useConfirmActionModal } from '../../../@generic/context/confirm-action-modal.context';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { AccountSelector } from '../../../account/component/account-selector/account-selector';
import { useConvertIncomeToTransferMutation } from '../../hooks/use-convert-income-to-transfer.mutation';

const ConvertToTransferSchema = z.object({
    fromAccountId: z.number().positive()
});

type ConvertToTransferForm = z.infer<typeof ConvertToTransferSchema>;

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly transactionId: number;
    readonly toAccountId: number;
}

export const ConvertIncomeToTransferBottomSheet = (props: Props) => {
    const { ref, transactionId, toAccountId } = props;

    const { t } = useLingui();
    const { openConfirmAction, updateConfirmActionParams } = useConfirmActionModal();

    const convertMutation = useConvertIncomeToTransferMutation();

    const form = useForm<ConvertToTransferForm>({
        resolver: zodResolver(ConvertToTransferSchema),
        mode: 'onChange'
    });

    const fromAccountId = useWatch({ control: form.control, name: 'fromAccountId' });

    const handleClose = () => void ref.current?.close();

    const handleConvert = async () => {
        if (!form.formState.isValid) {
            return;
        }

        handleClose();

        const confirmed = await openConfirmAction({
            variant: 'positive',
            icon: UserIconNameEnum.ArrowRightLeft,
            title: t`Convert to Transfer?`,
            description: t`This will convert the income to a transfer between accounts.`,
            buttonText: t`Convert to Transfer`
        });

        if (!confirmed) {
            return;
        }

        try {
            updateConfirmActionParams({ isLoading: true });
            await convertMutation(transactionId, form.getValues('fromAccountId'));
            dismissAllOrReplace(`/transactions/${transactionId}/transfer`);
        } catch {
            Toast.show({ type: 'error', text1: t`Conversion failed`, text2: t`Please try again` });
        }
    };

    const handleSelect = (accountId: number) => void form.setValue('fromAccountId', accountId, { shouldValidate: true });

    return (
        <BottomSheet ref={ref} enableDynamicSizing isCloseable>
            <BottomSheetView className="px-5 pt-xl pb-5xl">
                <CircleIcon
                    icon={UserIconNameEnum.ArrowRightLeft}
                    variant="positive"
                    size={50}
                    iconSize={24}
                    className="mb-4xl self-center rounded-3xl"
                />
                <Text className="text-primary text-xl font-semibold text-center mb-sm">
                    <Trans>Convert to Transfer?</Trans>
                </Text>
                <Text className="text-secondary-foreground text-center text-sm mb-3xl">
                    <Trans>Select the source account for this transfer.</Trans>
                </Text>
                <View className="mb-3xl">
                    <AccountSelector
                        accountId={fromAccountId}
                        excludeAccountId={toAccountId}
                        onSelect={handleSelect}
                        variant="positive"
                        cardVariant="ghost"
                    />
                </View>
                <View className="gap-y-md">
                    <Button
                        content={t`Convert to Transfer`}
                        disabled={!form.formState.isValid}
                        onPress={handleConvert}
                        variant="positive"
                    />
                    <Button onPress={handleClose} content={t`Cancel`} variant="ghost" />
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
};
/* jscpd:ignore-end */

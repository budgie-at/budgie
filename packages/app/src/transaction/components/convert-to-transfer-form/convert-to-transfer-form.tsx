import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { useForm, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FormSheetHeader } from '../../../@generic/component/form-sheet-header/form-sheet-header';
import { FormSheetSpacer } from '../../../@generic/component/form-sheet-spacer/form-sheet-spacer';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { useConfirmActionModal } from '../../../@generic/context/confirm-action-modal.context';
import { useFormsheetListStyles } from '../../../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useAccountSelector } from '../../../account/hooks/use-account-selector.hook';
import { ConvertToTransferFormValues, ConvertToTransferSchema } from '../../constant/convert-to-transfer-schema.constant';
import { useConvertExpenseToTransferMutation } from '../../hooks/use-convert-expense-to-transfer.mutation';
import { useConvertIncomeToTransferMutation } from '../../hooks/use-convert-income-to-transfer.mutation';

interface Props {
    readonly transactionId: number;
    readonly transactionType: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;
    readonly excludeAccountId: number;
    readonly onSuccess: () => void;
    readonly onCancel: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const ConvertToTransferForm = (props: Props) => {
    const { transactionId, transactionType, excludeAccountId, onSuccess, onCancel } = props;

    const { t } = useLingui();
    const { backgroundColor } = useFormsheetListStyles();
    const { openAccountSelector } = useAccountSelectorModal();
    const { openConfirmAction, updateConfirmActionParams } = useConfirmActionModal();

    const convertExpenseMutation = useConvertExpenseToTransferMutation();
    const convertIncomeMutation = useConvertIncomeToTransferMutation();

    const isExpense = transactionType === TransactionTypeEnum.EXPENSE;
    const confirmVariant = isExpense ? 'default' : 'positive';
    const buttonVariant = isExpense ? 'cta' : 'positive';

    const form = useForm<ConvertToTransferFormValues>({
        resolver: zodResolver(ConvertToTransferSchema),
        mode: 'onChange'
    });

    const accountId = useWatch({ control: form.control, name: 'accountId' });
    const accountIdForSelector = accountId > 0 ? accountId : null;
    const { selectedAccount, icon } = useAccountSelector({ accountId: accountIdForSelector });

    const containerStyle = { flex: 1, backgroundColor };
    const iconVariant = isDefined(selectedAccount) ? confirmVariant : 'secondary';
    const accountLabel = isExpense ? t`Select destination account` : t`Select source account`;
    const description = isExpense
        ? t`This will convert the expense to a transfer between accounts.`
        : t`This will convert the income to a transfer between accounts.`;

    const handleOpenAccountSelector = async () => {
        const selectedAccountId = await openAccountSelector({
            initialAccountId: accountId,
            excludeAccountId
        });

        if (isDefined(selectedAccountId)) {
            form.setValue('accountId', selectedAccountId, { shouldValidate: true });
        }
    };

    const handleConvert = async () => {
        if (!form.formState.isValid) {
            return;
        }

        const confirmed = await openConfirmAction({
            variant: confirmVariant,
            icon: UserIconNameEnum.ArrowRightLeft,
            title: t`Convert to Transfer?`,
            description,
            buttonText: t`Convert to Transfer`
        });

        if (!confirmed) {
            return;
        }

        try {
            updateConfirmActionParams({ isLoading: true });
            const selectedAccountId = form.getValues('accountId');

            if (isExpense) {
                await convertExpenseMutation(transactionId, selectedAccountId);
            } else {
                await convertIncomeMutation(transactionId, selectedAccountId);
            }

            onSuccess();
            dismissAllOrReplace(`/transactions/${transactionId}/transfer`);
        } catch {
            Toast.show({ type: 'error', text1: t`Conversion failed`, text2: t`Please try again` });
        }
    };

    return (
        <View style={containerStyle}>
            <FormSheetHeader>
                <Trans>Convert to Transfer</Trans>
            </FormSheetHeader>
            <View className="px-3xl gap-y-2xl">
                <Text className="text-secondary-foreground text-center text-sm">
                    {isExpense ? (
                        <Trans>Select the destination account for this transfer.</Trans>
                    ) : (
                        <Trans>Select the source account for this transfer.</Trans>
                    )}
                </Text>
                <SimpleHorizontalCell
                    variant="ghost"
                    title={selectedAccount?.title ?? accountLabel}
                    left={<CircleIcon icon={icon} variant={iconVariant} />}
                    onPress={handleOpenAccountSelector}
                />
                <View className="flex-row gap-x-md pt-md">
                    <Button className="flex-1" variant="ghost" onPress={onCancel} content={t`Cancel`} />
                    <Button
                        className="flex-1"
                        variant={buttonVariant}
                        disabled={!form.formState.isValid}
                        onPress={handleConvert}
                        content={t`Convert`}
                    />
                </View>
            </View>
            <FormSheetSpacer />
        </View>
    );
};

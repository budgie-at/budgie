import { TransactionEntryTypeEnum, TransactionTypeEnum, TransferTransactionCreateEntitySchema } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { prettifyError } from 'zod';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { DatePickerBottomSheet } from '../../../@generic/components/date-picker-bottom-sheet/date-picker-bottom-sheet';
import { FormItem } from '../../../@generic/components/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { FormAmountInput } from '../../../@generic/components/form-amount-input/form-amount-input';
import { AccountSelectorSquare } from '../../../account/component/account-selector-square/account-selector-square';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TagsSelector } from '../../../tag/components/tags-selector/tags-selector';
import { transactionService } from '../../service/transaction.service';
import { TransactionFormLayout } from '../transaction-form-layout/transaction-form-layout';

export const CreateTransferTransaction = () => {
    const [fromAccountId, setFromAccountId] = useState<number | null>(null);
    const [toAccountId, setToAccountId] = useState<number | null>(null);
    const [date, setDate] = useState<Date>(new Date());
    const { defaultInstrument } = useSettingsContext();
    const [amount, setAmount] = useState(0);
    const { t } = useLingui();

    const handleSwitchAccounts = () => {
        const temp = fromAccountId;

        setFromAccountId(toAccountId);
        setToAccountId(temp);
    }

    const handleSubmit = async () => {
        const parsed = TransferTransactionCreateEntitySchema.safeParse({
            exchangeRate: 1,
            externalId: null,
            fromAccountId,
            externalSource: null,
            toAccountId,
            type: TransactionTypeEnum.TRANSFER,
            operatedAt: date.toString(),
            title: '',
            comment: '',
            amount: convertToMicroUnits(amount),
            entries: [
                {
                    categoryId: null,
                    parentCategoryId: null,
                    accountId: fromAccountId,
                    parentAccountId: fromAccountId,
                    instrumentId: defaultInstrument.id,
                    amount: convertToMicroUnits(amount),
                    type: TransactionEntryTypeEnum.CREDIT
                },
                {
                    categoryId: null,
                    parentCategoryId: null,
                    accountId: toAccountId,
                    parentAccountId: toAccountId,
                    instrumentId: defaultInstrument.id,
                    amount: convertToMicroUnits(amount),
                    type: TransactionEntryTypeEnum.DEBIT
                }
            ]
        });

        if (parsed.success) {
            await transactionService.createInternal(parsed.data);
            router.back()
        } else {
            console.log({ error: prettifyError(parsed.error) });
        }
    };

    return (
        <TransactionFormLayout
            title={t`New Transfer`}
            variant="default"
            icon="ArrowRightLeft"
            onSubmit={handleSubmit}
            buttonText={t`Add Transfer`}
            description={t`Move Money`}
        >
            <View className="flex-row items-center justify-between pt-[40px] gap-x-lg">
                <AccountSelectorSquare
                    className="flex-1"
                    variant="default"
                    excludeAccountId={toAccountId}
                    accountId={fromAccountId}
                    onSelect={setFromAccountId}
                    title={t`FROM`}
                    emptyStateDescription={t`Create your first account to start tracking transactions`}
                />

                <HapticPressable onPress={handleSwitchAccounts}>
                    <CircleIcon size="xxs" variant="ghost" icon={ICONS.ArrowRightIcon} />
                </HapticPressable>

                <AccountSelectorSquare
                    className="flex-1"
                    variant="default"
                    title={t`TO`}
                    excludeAccountId={fromAccountId}
                    accountId={toAccountId}
                    onSelect={setToAccountId}
                    emptyStateDescription={t`Create your first account to start tracking transactions`}
                />
            </View>

            <FormAmountInput instrumentSymbol={defaultInstrument.symbol} variant="default" value={amount} onChange={setAmount} />

            <FormLayoutGroup>
                <FormLayoutGroup variant="horizontal">
                    <FormItem className="w-auto flex-1" label={t`Date`}>
                        <DatePickerBottomSheet variant="default" date={date} onChange={setDate} />
                    </FormItem>

                    <FormItem className="w-auto flex-1" label={t`Tags`}>
                        <TagsSelector variant="default" />
                    </FormItem>
                </FormLayoutGroup>
            </FormLayoutGroup>
        </TransactionFormLayout>
    );
};

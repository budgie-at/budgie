import { IncomeTransactionCreateEntitySchema, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { prettifyError } from 'zod';

import { DatePickerBottomSheet } from '../../../@generic/components/date-picker-bottom-sheet/date-picker-bottom-sheet';
import { FormItem } from '../../../@generic/components/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { AccountBalanceInput } from '../../../account/component/account-balance-input/account-balance-input';
import { AccountSelector } from '../../../account/component/account-selector/account-selector';
import { CategorySelector } from '../../../category/components/category-selector/category-selector';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TagsSelector } from '../../../tag/components/tags-selector/tags-selector';
import { transactionService } from '../../service/transaction.service';
import { TransactionFormLayout } from '../transaction-form-layout/transaction-form-layout';

export const CreateIncomeTransaction = () => {
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [accountId, setAccountId] = useState<number | null>(null);
    const [date, setDate] = useState<Date>(new Date());
    const { defaultInstrument } = useSettingsContext();
    const [amount, setAmount] = useState(0);
    const { t } = useLingui();

    const handleSubmit = async () => {
        const parsed = IncomeTransactionCreateEntitySchema.safeParse({
            amount: convertToMicroUnits(amount),
            exchangeRate: 1,
            externalId: null,
            fromAccountId: null,
            externalSource: null,
            toAccountId: accountId,
            type: TransactionTypeEnum.INCOME,
            operatedAt: date.toString(),
            title: '',
            comment: '',
            entries: [
                {
                    accountId,
                    categoryId,
                    parentAccountId: accountId,
                    parentCategoryId: categoryId,
                    instrumentId: defaultInstrument.id,
                    amount: convertToMicroUnits(amount),
                    type: TransactionEntryTypeEnum.DEBIT
                }
            ]
        });

        if (parsed.success) {
            await transactionService.createInternal(parsed.data);
        } else {
            console.log({ error: prettifyError(parsed.error) });
        }
    };

    return (
        <TransactionFormLayout
            title={t`New Income`}
            variant="positive"
            icon="TrendingUp"
            buttonText={t`Add Income`}
            description={t`Select Category`}
            onSubmit={handleSubmit}
        >
            <AccountBalanceInput instrumentSymbol={defaultInstrument.symbol} variant="positive" value={amount} onChange={setAmount} />

            <FormLayoutGroup>
                <FormItem label={t`Account`}>
                    <AccountSelector
                        variant="positive"
                        accountId={accountId}
                        onSelect={setAccountId}
                        emptyStateDescription={t`Create your first account to start tracking transactions`}
                    />
                </FormItem>

                <FormItem label={t`Category`}>
                    <CategorySelector categoryId={categoryId} onSelect={setCategoryId} variant="positive" />
                </FormItem>

                <FormLayoutGroup variant="horizontal">
                    <FormItem className="w-auto flex-1" label={t`Date`}>
                        <DatePickerBottomSheet variant="positive" date={date} onChange={setDate} />
                    </FormItem>

                    <FormItem className="w-auto flex-1" label={t`Tags`}>
                        <TagsSelector variant="positive" />
                    </FormItem>
                </FormLayoutGroup>
            </FormLayoutGroup>
        </TransactionFormLayout>
    );
};

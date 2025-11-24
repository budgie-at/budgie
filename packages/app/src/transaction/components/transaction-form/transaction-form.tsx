import { TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ZodSchema, prettifyError } from 'zod';

import { DatePickerBottomSheet } from '../../../@generic/components/date-picker-bottom-sheet/date-picker-bottom-sheet';
import { FormItem } from '../../../@generic/components/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { IconName } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { AccountBalanceInput } from '../../../account/component/account-balance-input/account-balance-input';
import { AccountSelector } from '../../../account/component/account-selector/account-selector';
import { CategorySelector } from '../../../category/components/category-selector/category-selector';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TagsSelector } from '../../../tag/components/tags-selector/tags-selector';
import { transactionService } from '../../service/transaction.service';
import { TransactionFormLayout } from '../transaction-form-layout/transaction-form-layout';

interface Props {
    readonly transactionType: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;
    readonly entryType: TransactionEntryTypeEnum.CREDIT | TransactionEntryTypeEnum.DEBIT;
    readonly variant: ColorPaletteVariant;
    readonly icon: IconName;
    readonly title: string;
    readonly buttonText: string;
    readonly schema: ZodSchema;
}

export const TransactionForm = ({ transactionType, entryType, variant, icon, title, buttonText, schema }: Props) => {
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [accountId, setAccountId] = useState<number | null>(null);
    const { defaultInstrument } = useSettingsContext();
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState(new Date());
    const { t } = useLingui();

    const isExpense = transactionType === TransactionTypeEnum.EXPENSE;

    const handleSubmit = async () => {
        const parsed = schema.safeParse({
            amount: convertToMicroUnits(amount),
            exchangeRate: 1,
            externalId: null,
            externalSource: null,
            fromAccountId: isExpense ? accountId : null,
            toAccountId: isExpense ? null : accountId,
            operatedAt: date.toString(),
            type: transactionType,
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
                    type: entryType
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
            title={title}
            variant={variant}
            icon={icon}
            onSubmit={handleSubmit}
            buttonText={buttonText}
            description={t`Select Category`}
        >
            <AccountBalanceInput instrumentSymbol={defaultInstrument.symbol} variant={variant} value={amount} onChange={setAmount} />

            <FormLayoutGroup>
                <FormItem label={t`Account`}>
                    <AccountSelector
                        variant={variant}
                        accountId={accountId}
                        onSelect={setAccountId}
                        emptyStateDescription={t`Create your first account to start tracking transactions`}
                    />
                </FormItem>

                <FormItem label={t`Category`}>
                    <CategorySelector categoryId={categoryId} onSelect={setCategoryId} variant={variant} />
                </FormItem>

                <FormLayoutGroup variant="horizontal">
                    <FormItem className="w-auto flex-1" label={t`Date`}>
                        <DatePickerBottomSheet variant={variant} date={date} onChange={setDate} />
                    </FormItem>

                    <FormItem className="w-auto flex-1" label={t`Tags`}>
                        <TagsSelector variant={variant} />
                    </FormItem>
                </FormLayoutGroup>
            </FormLayoutGroup>
        </TransactionFormLayout>
    );
};

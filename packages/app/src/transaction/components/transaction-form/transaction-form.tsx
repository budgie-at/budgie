import { TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { useForm } from 'react-hook-form';
import { z, ZodSchema } from 'zod';

import { DatePickerBottomSheet } from '../../../@generic/components/date-picker-bottom-sheet/date-picker-bottom-sheet';
import { FormItem } from '../../../@generic/components/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { IconName } from '../../../@generic/type/icon-name.type';
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

// Form-specific validation schema
const FormSchema = z.object({
    categoryId: z.number().nullable(),
    accountId: z.number().nullable(),
    date: z.date(),
    amount: z.number().positive()
});

type FormValues = z.infer<typeof FormSchema>;

export const TransactionForm = ({ transactionType, entryType, variant, icon, title, buttonText, schema }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const { t } = useLingui();

    const {
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm<FormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            categoryId: null,
            accountId: null,
            date: new Date(),
            amount: 0
        }
    });

    const categoryId = watch('categoryId');
    const accountId = watch('accountId');
    const date = watch('date');
    const amount = watch('amount');

    const isExpense = transactionType === TransactionTypeEnum.EXPENSE;

    const onSubmit = async (data: FormValues) => {
        const transactionData = {
            exchangeRate: 1,
            externalId: null,
            externalSource: null,
            fromAccountId: isExpense ? data.accountId : null,
            toAccountId: isExpense ? null : data.accountId,
            operatedAt: data.date.toISOString(),
            type: transactionType,
            title: '',
            comment: '',
            entries: [
                {
                    accountId: data.accountId,
                    categoryId: data.categoryId,
                    parentAccountId: data.accountId,
                    parentCategoryId: data.categoryId,
                    instrumentId: defaultInstrument.id,
                    amount: convertToMicroUnits(data.amount),
                    type: entryType
                }
            ]
        };

        const parsed = schema.safeParse(transactionData);

        if (parsed.success) {
            await transactionService.createInternal(parsed.data);
        } else {
            console.error({ error: parsed.error });
        }
    };

    return (
        <TransactionFormLayout
            title={title}
            variant={variant}
            icon={icon}
            onSubmit={handleSubmit(onSubmit)}
            buttonText={buttonText}
            description={t`Select Category`}
        >
            <AccountBalanceInput
                instrumentSymbol={defaultInstrument.symbol}
                variant={variant}
                value={amount}
                onChange={value => setValue('amount', value, { shouldValidate: true })}
            />

            <FormLayoutGroup>
                <FormItem label={t`Account`} error={errors.accountId?.message}>
                    <AccountSelector
                        variant={variant}
                        accountId={accountId}
                        onSelect={id => setValue('accountId', id, { shouldValidate: true })}
                        emptyStateDescription={t`Create your first account to start tracking transactions`}
                    />
                </FormItem>

                <FormItem label={t`Category`} error={errors.categoryId?.message}>
                    <CategorySelector
                        categoryId={categoryId}
                        onSelect={id => setValue('categoryId', id, { shouldValidate: true })}
                        variant={variant}
                    />
                </FormItem>

                <FormLayoutGroup variant="horizontal">
                    <FormItem className="w-auto flex-1" label={t`Date`} error={errors.date?.message}>
                        <DatePickerBottomSheet
                            variant={variant}
                            date={date}
                            onChange={newDate => setValue('date', newDate, { shouldValidate: true })}
                        />
                    </FormItem>

                    <FormItem className="w-auto flex-1" label={t`Tags`}>
                        <TagsSelector variant={variant} />
                    </FormItem>
                </FormLayoutGroup>
            </FormLayoutGroup>
        </TransactionFormLayout>
    );
};

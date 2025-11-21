/* eslint-disable lingui/no-unlocalized-strings */
import { IncomeTransactionCreateEntitySchema, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { prettifyError } from 'zod';

import { Button } from '../../../@generic/components/button/button';
import { DatePickerBottomSheet } from '../../../@generic/components/date-picker-bottom-sheet/date-picker-bottom-sheet';
import { FormItem } from '../../../@generic/components/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { Page } from '../../../@generic/components/page/page';
import { PageHeader } from '../../../@generic/components/page-header/page-header';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { AccountBalanceInput } from '../../../account/component/account-balance-input/account-balance-input';
import { AccountSelector } from '../../../account/component/account-selector/account-selector';
import { CategorySelector } from '../../../category/components/category-selector/category-selector';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TagsSelector } from '../../../tag/components/tags-selector/tags-selector';
import { transactionService } from '../../service/transaction.service';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';

const textVariants = cva('text-[72px]', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const CreateIncomeTransaction = () => {
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [accountId, setAccountId] = useState<number | null>(null);
    const [date, setDate] = useState<Date>(new Date());
    const { defaultInstrument } = useSettingsContext();
    const [amount, setAmount] = useState(0);
    const { t } = useLingui();

    const pageDescription = t`Select Category`;

    const goBack = () => void router.back();

    const instrumentSymbol = '$';

    const handleSubmit = async () => {
        console.log({date});
        const parsed = IncomeTransactionCreateEntitySchema.safeParse({
            exchangeRate: 1,
            externalId: null,
            fromAccountId: null,
            externalSource: null,
            toAccountId: accountId,
            type: TransactionTypeEnum.INCOME,
            operatedAt: date.toString(),
            title: 'Some title of the transaction',
            comment: 'Some comment of the transaction',
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
            await transactionService.createIncome(parsed.data);
            // router.push('/transactions')
            console.log('Success:', parsed.data);
        } else {
            console.log({ error: prettifyError(parsed.error) });
        }
    };

    return (
        <Page
            header={
                <PageHeader
                    right={
                        <HapticPressable className="p-md rounded-full active:bg-primary/1" onPress={goBack}>
                            <Icon icon={ICONS.X} size={24} className="text-secondary-foreground" />
                        </HapticPressable>
                    }
                    description={pageDescription}
                    title={t`New Income`}
                    icon="TrendingUp"
                    iconVariant="positive"
                />
            }
            footer={
                <View className="border-t border-t-secondary-corner pt-5xl px-5xl">
                    <SafeAreaView edges={['bottom']}>
                        <Button
                            onPress={handleSubmit}
                            className="bg-positive-foreground border-positive-foreground"
                            textClassName="text-white"
                            content={t`Add Income`}
                        />
                    </SafeAreaView>
                </View>
            }
        >
            <View className="flex-row items-center justify-center pt-[40px] pb-7xl">
                <Text className={textVariants({ variant: 'positive' })}>{instrumentSymbol} </Text>

                <AccountBalanceInput value={amount} onChange={setAmount} />
            </View>

            <FormLayoutGroup>
                <FormItem label={t`Account`}>
                    <AccountSelector
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
                        <DatePickerBottomSheet date={date} onChange={setDate} />
                    </FormItem>

                    <FormItem className="w-auto flex-1" label={t`Tags`}>
                        <TagsSelector variant="positive" />
                    </FormItem>
                </FormLayoutGroup>
            </FormLayoutGroup>
        </Page>
    );
};

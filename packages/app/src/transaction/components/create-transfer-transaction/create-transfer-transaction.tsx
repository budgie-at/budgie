import { TransactionCreateEntityInterface, TransactionTypeEnum, TransferTransactionCreateEntitySchema } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { FormItem } from '../../../@generic/components/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { AccountSelectorSquare } from '../../../account/component/account-selector-square/account-selector-square';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TagsSelector } from '../../../tag/components/tags-selector/tags-selector';
import { useCreateTransactionForm } from '../../hook/use-create-transaction-form.hook';
import { TransactionTransferFormAmount } from '../transaction-form-amount/transaction-transfer-form-amount';
import { TransactionFormDatePicker } from '../transaction-form-date-picker/transaction-form-date-picker';
import { TransactionFormLayout } from '../transaction-form-layout/transaction-form-layout';
import { TransactionTransferFormCategory } from '../transaction-form-category/transaction-transfer-form-category';

export const CreateTransferTransaction = () => {
    const { defaultInstrument } = useSettingsContext();
    const { t } = useLingui();

    const { form, handleSubmit } = useCreateTransactionForm({
        schema: TransferTransactionCreateEntitySchema,
        type: TransactionTypeEnum.TRANSFER,
        fromAccountId: null,
        toAccountId: null
    });

    const [fromAccountId, toAccountId] = useWatch({
        control: form.control,
        name: ['fromAccountId', 'toAccountId']
    });

    const errors = form.formState.errors;
    console.log(JSON.stringify({ errors }, null, 4));

    const handleSwitchAccounts = () => {
        const temp = fromAccountId;

        form.setValue('fromAccountId', toAccountId);
        form.setValue('toAccountId', temp);

        form.setValue('entries.0.accountId', fromAccountId);
        form.setValue('entries.1.accountId', toAccountId);
    };

    const renderDateInput = ({ field: { value, onChange } }: UseControllerReturn<TransactionCreateEntityInterface, 'operatedAt'>) => (
        <FormItem className="w-auto flex-1" label={t`Date`}>
            <TransactionFormDatePicker variant="default" date={value} onChange={onChange} />
        </FormItem>
    );

    const renderTagsSelector = ({ field: { value, onChange } }: UseControllerReturn<TransactionCreateEntityInterface, 'tagIds'>) => (
        <FormItem className="w-auto flex-1" label={t`Tags`}>
            <TagsSelector tagIds={value} onChange={onChange} variant="default" />
        </FormItem>
    );

    const renderFromAccount = ({ field: { value, onChange } }: UseControllerReturn<TransactionCreateEntityInterface, 'fromAccountId'>) => {
        const handleChange = (accountId: number) => {
            form.setValue('entries.0.accountId', accountId);
            onChange(accountId);
        };

        return (
            <AccountSelectorSquare
                className="flex-1"
                variant="default"
                excludeAccountId={toAccountId}
                accountId={value}
                onSelect={handleChange}
                title={t`FROM`}
                emptyStateDescription={t`Create your first account to start tracking transactions`}
            />
        );
    };

    const renderToAccount = ({ field: { value, onChange } }: UseControllerReturn<TransactionCreateEntityInterface, 'toAccountId'>) => {
        const handleChange = (accountId: number) => {
            form.setValue('entries.1.accountId', accountId);
            onChange(accountId);
        };

        return (
            <AccountSelectorSquare
                className="flex-1"
                variant="default"
                title={t`TO`}
                excludeAccountId={fromAccountId}
                accountId={value}
                onSelect={handleChange}
                emptyStateDescription={t`Create your first account to start tracking transactions`}
            />
        );
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
                <Controller render={renderFromAccount} control={form.control} name="fromAccountId" />

                <HapticPressable onPress={handleSwitchAccounts}>
                    <CircleIcon size="xxs" variant="ghost" icon={ICONS.ArrowRightIcon} />
                </HapticPressable>

                <Controller render={renderToAccount} name="toAccountId" control={form.control} />
            </View>

            <TransactionTransferFormAmount
                control={form.control}
                setValue={form.setValue}
                variant="default"
                instrumentSymbol={defaultInstrument.symbol}
            />

            <FormLayoutGroup>
                <TransactionTransferFormCategory setValue={form.setValue} control={form.control} variant="default" />

                <FormLayoutGroup variant="horizontal">
                    <Controller render={renderDateInput} control={form.control} name="operatedAt" />

                    <Controller render={renderTagsSelector} name="tagIds" control={form.control} />
                </FormLayoutGroup>
            </FormLayoutGroup>
        </TransactionFormLayout>
    );
};

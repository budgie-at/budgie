import { TransactionCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn, UseFormSetValue, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { FormItem } from '../../../@generic/components/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { IconName, ICONS } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountSelectorSquare } from '../../../account/component/account-selector-square/account-selector-square';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TagsSelector } from '../../../tag/components/tags-selector/tags-selector';
import { TransactionTransferFormAmount } from '../transaction-form-amount/transaction-transfer-form-amount';
import { TransactionTransferFormCategory } from '../transaction-form-category/transaction-transfer-form-category';
import { TransactionFormDatePicker } from '../transaction-form-date-picker/transaction-form-date-picker';
import { TransactionFormLayout } from '../transaction-form-layout/transaction-form-layout';

interface Props {
    readonly icon: IconName;
    readonly onSubmit: EmptyFn;
    readonly control: Control<TransactionCreateEntityInterface>;
    readonly setValue: UseFormSetValue<TransactionCreateEntityInterface>;
    readonly title: string;
    readonly buttonText: string;
    readonly variant: ColorPaletteVariant;
}

export const TransferTransactionForm = ({ onSubmit, icon, control, setValue, title, buttonText, variant }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const { t } = useLingui();

    const [fromAccountId, toAccountId] = useWatch({
        control,
        name: ['fromAccountId', 'toAccountId']
    });

    const handleSwitchAccounts = () => {
        const temp = fromAccountId;

        setValue('fromAccountId', toAccountId);
        setValue('toAccountId', temp);

        setValue('entries.0.accountId', fromAccountId);
        setValue('entries.1.accountId', toAccountId);
    };

    const renderDateInput = ({ field: { value, onChange } }: UseControllerReturn<TransactionCreateEntityInterface, 'operatedAt'>) => (
        <FormItem className="w-auto flex-1" label={t`Date`}>
            <TransactionFormDatePicker variant={variant} date={value} onChange={onChange} />
        </FormItem>
    );

    const renderTagsSelector = ({ field: { value, onChange } }: UseControllerReturn<TransactionCreateEntityInterface, 'tagIds'>) => (
        <FormItem className="w-auto flex-1" label={t`Tags`}>
            <TagsSelector tagIds={value} onChange={onChange} variant={variant} />
        </FormItem>
    );

    const renderFromAccount = ({ field: { value, onChange } }: UseControllerReturn<TransactionCreateEntityInterface, 'fromAccountId'>) => {
        const handleChange = (accountId: number) => {
            setValue('entries.0.accountId', accountId);
            onChange(accountId);
        };

        return (
            <AccountSelectorSquare
                className="flex-1"
                variant={variant}
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
            setValue('entries.1.accountId', accountId);
            onChange(accountId);
        };

        return (
            <AccountSelectorSquare
                className="flex-1"
                variant={variant}
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
            icon={icon}
            title={title}
            variant={variant}
            onSubmit={onSubmit}
            buttonText={buttonText}
            description={t`Move Money`}
        >
            <View className="flex-row items-center justify-between pt-[40px] gap-x-lg">
                <Controller render={renderFromAccount} control={control} name="fromAccountId" />

                <HapticPressable onPress={handleSwitchAccounts}>
                    <CircleIcon size="xxs" variant="ghost" icon={ICONS.ArrowRightIcon} />
                </HapticPressable>

                <Controller render={renderToAccount} name="toAccountId" control={control} />
            </View>

            <TransactionTransferFormAmount
                control={control}
                setValue={setValue}
                variant={variant}
                instrumentSymbol={defaultInstrument.symbol}
            />

            <FormLayoutGroup>
                <TransactionTransferFormCategory setValue={setValue} control={control} variant={variant} />

                <FormLayoutGroup variant="horizontal">
                    <Controller render={renderDateInput} control={control} name="operatedAt" />

                    <Controller render={renderTagsSelector} name="tagIds" control={control} />
                </FormLayoutGroup>
            </FormLayoutGroup>
        </TransactionFormLayout>
    );
};

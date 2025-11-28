import { TransactionCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';
import { ScrollView } from 'react-native';

import { DatePickerBottomSheet } from '../../../@generic/components/date-picker-bottom-sheet/date-picker-bottom-sheet';
import { FormItem } from '../../../@generic/components/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { IconName } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountSelector } from '../../../account/component/account-selector/account-selector';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TagsSelector } from '../../../tag/components/tags-selector/tags-selector';
import { TransactionFormAmount } from '../transaction-form-amount/transaction-form-amount';
import { TransactionFormCategory } from '../transaction-form-category/transaction-form-category';
import { TransactionFormLayout } from '../transaction-form-layout/transaction-form-layout';

interface Props {
    onSubmit: () => void;
    control: Control<TransactionCreateEntityInterface>;
    icon: IconName;
    title: string;
    buttonText: string;
    variant: ColorPaletteVariant;
    accountFieldName: 'toAccountId' | 'fromAccountId';
}

export const TransactionForm = ({ onSubmit, control, icon, buttonText, title, variant, accountFieldName }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const { t } = useLingui();

    const renderAccountSelector = ({
        field: { onChange, value },
        fieldState: { error, invalid }
    }: UseControllerReturn<TransactionCreateEntityInterface, typeof accountFieldName>) => {
        const status = invalid ? 'error' : 'default';

        return (
            <FormItem label={t`Account`}>
                <AccountSelector
                    status={status}
                    variant={variant}
                    accountId={value}
                    onSelect={onChange}
                    error={error?.message}
                    emptyStateDescription={t`Create your first account to start tracking transactions`}
                />
            </FormItem>
        );
    };

    const renderDateInput = ({ field: { value, onChange } }: UseControllerReturn<TransactionCreateEntityInterface, 'operatedAt'>) => (
        <FormItem className="w-auto flex-1" label={t`Date`}>
            <DatePickerBottomSheet variant={variant} date={new Date(value)} onChange={onChange} />
        </FormItem>
    );

    return (
        <TransactionFormLayout
            title={title}
            variant={variant}
            icon={icon}
            onSubmit={onSubmit}
            buttonText={buttonText}
            description={t`Select Category`}
        >
            <ScrollView contentContainerClassName="pb-7xl" showsVerticalScrollIndicator={false}>
                <TransactionFormAmount instrumentSymbol={defaultInstrument.symbol} control={control} variant={variant} />

                <FormLayoutGroup>
                    <Controller render={renderAccountSelector} name={accountFieldName} control={control} />

                    <TransactionFormCategory control={control} variant={variant} />

                    <FormLayoutGroup variant="horizontal">
                        <Controller render={renderDateInput} name="operatedAt" control={control} />

                        <FormItem className="w-auto flex-1" label={t`Tags`}>
                            <TagsSelector variant={variant} />
                        </FormItem>
                    </FormLayoutGroup>
                </FormLayoutGroup>
            </ScrollView>
        </TransactionFormLayout>
    );
};

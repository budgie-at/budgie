import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Control, Controller, UseControllerReturn, UseFormSetValue, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountSelectorSquare } from '../../../account/component/account-selector-square/account-selector-square';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { getTransferCategoryId } from '../../utils/get-transfer-category-id.util';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly control: Control<TransactionCreateInputInterface>;
    readonly setValue: UseFormSetValue<TransactionCreateInputInterface>;
}

export const TransferTransactionFormAccounts = ({ control, setValue, variant }: Props) => {
    const { t } = useLingui();

    const [fromAccountId, toAccountId] = useWatch({
        control,
        name: ['fromAccountId', 'toAccountId']
    });

    const { account: fromAccount } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const { account: toAccount } = useGetAccountByIdQuery(toAccountId ?? 0);

    useEffect(() => {
        if (isDefined(fromAccount) && isDefined(toAccount)) {
            const categoryId = getTransferCategoryId(fromAccount.type, toAccount.type);

            if (isDefined(categoryId)) {
                setValue('entries.0.categoryId', categoryId);
                setValue('entries.1.categoryId', categoryId);
            }
        }
    }, [fromAccount, toAccount, setValue]);

    const handleAccountSelect = (entryIndex: 0 | 1, accountId: number) => {
        const fieldName = entryIndex === 0 ? 'fromAccountId' : 'toAccountId';

        setValue(fieldName, accountId);
        setValue(`entries.${entryIndex}.accountId`, accountId);
    };

    const handleSwitchAccounts = () => {
        setValue('fromAccountId', toAccountId);
        setValue('toAccountId', fromAccountId);

        setValue('entries.0.accountId', toAccountId ?? 0);
        setValue('entries.1.accountId', fromAccountId ?? 0);
    };

    const renderFromAccount = ({
        field: { value, onChange },
        fieldState: { invalid }
    }: UseControllerReturn<TransactionCreateInputInterface, 'fromAccountId'>) => {
        const handleChange = (accountId: number) => {
            onChange(accountId);
            handleAccountSelect(0, accountId);
        };
        const status = invalid ? 'error' : 'default';

        return (
            <AccountSelectorSquare
                className="flex-1"
                status={status}
                variant={variant}
                excludeAccountId={toAccountId}
                accountId={value}
                onSelect={handleChange}
                title={t`FROM`}
                emptyStateDescription={t`Create your first account to start tracking transactions`}
            />
        );
    };

    const renderToAccount = ({
        field: { value, onChange },
        fieldState: { invalid }
    }: UseControllerReturn<TransactionCreateInputInterface, 'toAccountId'>) => {
        const handleChange = (accountId: number) => {
            onChange(accountId);
            handleAccountSelect(1, accountId);
        };

        const status = invalid ? 'error' : 'default';

        return (
            <AccountSelectorSquare
                className="flex-1"
                variant={variant}
                status={status}
                title={t`TO`}
                excludeAccountId={fromAccountId}
                accountId={value}
                onSelect={handleChange}
                emptyStateDescription={t`Create your first account to start tracking transactions`}
            />
        );
    };

    return (
        <View className="flex-row items-center justify-between gap-x-lg">
            <Controller render={renderFromAccount} control={control} name="fromAccountId" />

            <HapticPressable onPress={handleSwitchAccounts}>
                <CircleIcon size="xxs" variant="ghost" icon={ICONS.ArrowRightIcon} />
            </HapticPressable>

            <Controller render={renderToAccount} name="toAccountId" control={control} />
        </View>
    );
};

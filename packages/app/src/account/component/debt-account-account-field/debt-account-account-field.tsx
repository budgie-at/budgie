import { AccountDebtTypeEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, Path, UseControllerReturn } from 'react-hook-form';

import { isPositiveNumber } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { AccountSelector } from '../account-selector/account-selector';

interface Props<T extends { accountId: number | null }> {
    readonly control: Control<T>;
    readonly debtType: AccountDebtTypeEnum;
}

const descriptionMap = {
    [AccountDebtTypeEnum.LENT]: {
        selected: msg`Money came from here`,
        empty: msg`Which account did the money come from?`
    },
    [AccountDebtTypeEnum.BORROW]: {
        selected: msg`Money will be added here`,
        empty: msg`Which account did the money come from?`
    }
} as const;

export const DebtAccountAccountField = <T extends { accountId: number | null }>({ control, debtType }: Props<T>) => {
    const { t, i18n } = useLingui();

    const render = ({ field: { value, onChange } }: UseControllerReturn<T, Path<T>>) => {
        const description = isPositiveNumber(value) ? descriptionMap[debtType].selected : descriptionMap[debtType].empty;

        return (
            <FormItem label={t`Link to Account (Optional)`}>
                <AccountSelector description={i18n.t(description)} accountId={value} variant={ACCOUNT_COLOR.DEBT} onSelect={onChange} />
            </FormItem>
        );
    };

    return <Controller render={render} name={'accountId' as Path<T>} control={control} />;
};

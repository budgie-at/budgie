import { AccountDebtTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, Path, UseControllerReturn, useWatch } from 'react-hook-form';

import { ContactSelector } from '../../../@generic/component/contact-selector/contact-selector';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

interface Props<T extends { contactId: string | null; debtType: AccountDebtTypeEnum }> {
    readonly control: Control<T>;
}

export const DebtAccountContactField = <T extends { contactId: string | null; debtType: AccountDebtTypeEnum }>({ control }: Props<T>) => {
    const { t } = useLingui();
    const debtType = useWatch({ control, name: 'debtType' as Path<T> });
    const isBorrowAccount = debtType === AccountDebtTypeEnum.BORROW;
    const emptyDescription = isBorrowAccount ? t`Who do you owe?` : t`Who owes you?`;
    const selectedDescription = isBorrowAccount ? t`You owe` : t`Owes you`;

    const render = ({ field: { value, onChange } }: UseControllerReturn<T, Path<T>>) => (
        <FormItem label={t`Contact (optional)`}>
            <ContactSelector
                testID={CreateAccountScreenSelector.ContactSelector}
                variant={ACCOUNT_COLOR.DEBT}
                contactId={value}
                emptyDescription={emptyDescription}
                selectedDescription={selectedDescription}
                onSelect={onChange}
            />
        </FormItem>
    );

    return <Controller render={render} control={control} name={'contactId' as Path<T>} />;
};

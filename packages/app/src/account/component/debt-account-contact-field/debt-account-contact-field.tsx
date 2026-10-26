import { AccountDebtTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { ContactSelector } from '../../../@generic/component/contact-selector/contact-selector';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

interface Props {
    readonly value: string | null;
    readonly onChange: (value: string | null) => void;
    readonly debtType: AccountDebtTypeEnum;
}

export const DebtAccountContactField = ({ value, onChange, debtType }: Props) => {
    const { t } = useLingui();
    const isBorrowAccount = debtType !== AccountDebtTypeEnum.LENT;
    const emptyDescription = isBorrowAccount ? t`Who do you owe?` : t`Who owes you?`;
    const selectedDescription = isBorrowAccount ? t`You owe` : t`Owes you`;

    return (
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
};

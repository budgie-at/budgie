import { useLingui } from '@lingui/react/macro';

import { EmptyFn } from '@rnw-community/shared';

import { UpdateAccountPage } from '../../../account/component/update-account-page/update-account-page';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';

import type { AccountFormBindingsInterface } from '../../../account/interface/account-form-bindings.interface';
import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: AccountEntityInterface;
    readonly balance: number;
    readonly fields: Pick<AccountFormBindingsInterface, 'title' | 'icon' | 'isActive' | 'includeInNetWorth'>;
    readonly isSubmitting: boolean;
    readonly onSubmit: EmptyFn;
}

export const UpdateInzhurAccountPage = ({ account, balance, fields, isSubmitting, onSubmit }: Props) => {
    const { t } = useLingui();
    const formatFundQuantity = useFormatFundQuantity();
    const quantityLabel = formatFundQuantity(balance);

    return (
        <UpdateAccountPage
            account={account}
            fields={fields}
            detailsFooter={t`${quantityLabel} · updated from imports`}
            hero={null}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
        />
    );
};

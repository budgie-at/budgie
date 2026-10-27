import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { useTransactionAccountFilterModal } from '../../context/transaction-account-filter-modal.context';

import type { TransactionFilterInterface } from '@budgie/contracts';
import type { Dispatch, SetStateAction } from 'react';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly onChange: Dispatch<SetStateAction<TransactionFilterInterface>>;
}

export const AnalyticsChooseAccounts = ({ filters, onChange }: Props) => {
    const { t } = useLingui();
    const [openAccountFilter] = useTransactionAccountFilterModal();

    const handleChooseAccounts = () => {
        openAccountFilter({ value: filters.accountIds }, result => {
            if (isDefined(result)) {
                onChange(current => ({ ...current, accountIds: result.value }));
            }
        });
    };

    return <Button content={t`Choose accounts`} leftIcon={UserIconNameEnum.Wallet} onPress={handleChooseAccounts} variant="primary" />;
};

import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useTransactionDateLabel } from '../../hook/use-transaction-date-label.hook';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionFieldIcon } from '../transaction-field-icon/transaction-field-icon';

import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly onPress: EmptyFn;
}

export const TransactionDateFieldIcon = ({ onPress }: Props) => {
    const { t } = useLingui();
    const formattedDate = useTransactionDateLabel();

    return (
        <TransactionFieldIcon
            icon={UserIconNameEnum.Calendar}
            label={t`Date`}
            value={formattedDate}
            onPress={onPress}
            testID={SimpleQuickFormSelector.DatePicker}
        />
    );
};

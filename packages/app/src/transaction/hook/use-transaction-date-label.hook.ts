import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { useI18nContext } from '../../i18n/context/i18n.context';
import { formatOperatedAt } from '../utils/format-operated-at.util';

export const useTransactionDateLabel = () => {
    const { t } = useLingui();
    const { intl } = useI18nContext();
    const { control } = useFormContext<TransactionCreateInputInterface>();
    const operatedAt = useWatch({ control, name: 'operatedAt' });

    return formatOperatedAt({ date: operatedAt, today: t`Today`, yesterday: t`Yesterday`, formatDate: intl.formatDate });
};

import { TransactionCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { useI18nContext } from '../../../i18n/context/i18n.context';
import { formatOperatedAt } from '../../utils/format-operated-at.util';
import { TransactionFieldIcon } from '../transaction-field-icon/transaction-field-icon';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly onPress: EmptyFn;
}

export const TransactionDateFieldIcon = ({ variant, onPress }: Props) => {
    const { t } = useLingui();
    const { intl } = useI18nContext();
    const { control } = useFormContext<TransactionCreateInputInterface>();
    const operatedAt = useWatch({ control, name: 'operatedAt' });

    const formattedDate = formatOperatedAt({
        date: operatedAt,
        today: t`Today`,
        yesterday: t`Yesterday`,
        formatDate: intl.formatDate
    });

    return (
        <TransactionFieldIcon
            icon={UserIconNameEnum.Calendar}
            label={t`Date`}
            value={formattedDate}
            variant={variant}
            onPress={onPress}
            animationDelay={110}
        />
    );
};

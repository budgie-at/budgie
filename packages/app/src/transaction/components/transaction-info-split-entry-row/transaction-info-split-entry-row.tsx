import { UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionEntryWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly entry: TransactionEntryWithRelationsEntityInterface;
    readonly testID: string;
}

export const TransactionInfoSplitEntryRow = ({ entry, testID }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const { category } = entry;
    const icon = isDefined(category) ? category.icon : UserIconNameEnum.CircleDashed;
    const title = isDefined(category) ? category.title : t`Uncategorized`;
    const valueClassName = isDefined(category) ? '' : 'text-attention-foreground';

    return (
        <TransactionInfoRow
            icon={icon}
            value={title}
            valueClassName={valueClassName}
            trailing={formatDigits(convertFromMicroUnits(entry.amount), entry.account.instrument.symbol)}
            testID={testID}
        />
    );
};

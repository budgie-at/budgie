import { RecurringSeriesSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { TransactionInfoActionRow } from '../../../transaction/components/transaction-info-action-row/transaction-info-action-row';
import { TransactionInfoGroup } from '../../../transaction/components/transaction-info-group/transaction-info-group';
import { RecurringDetailSelector } from '../recurring-detail-content/recurring-detail.selector';

interface Props {
    readonly source: RecurringSeriesSourceEnum;
    readonly onRemove: () => void;
}

export const RecurringDetailDestructiveRow = ({ source, onRemove }: Props) => {
    const { t } = useLingui();
    const isDetected = source === RecurringSeriesSourceEnum.DETECTED;
    const label = isDetected ? t`Not recurring` : t`Delete`;
    const icon = isDetected ? UserIconNameEnum.Ban : UserIconNameEnum.Trash2;

    return (
        <TransactionInfoGroup>
            <TransactionInfoActionRow
                icon={icon}
                label={label}
                onPress={onRemove}
                testID={RecurringDetailSelector.RemoveButton}
                colorClassName="text-destructive-strong"
            />
        </TransactionInfoGroup>
    );
};

import { RecurringSeriesSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

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

    const footnote = isDetected
        ? t`Past payments stay in your transactions. Budgie stops expecting new ones.`
        : t`Past payments stay in your transactions.`;

    return (
        <View className="gap-y-md">
            <TransactionInfoGroup>
                <TransactionInfoActionRow
                    icon={icon}
                    label={label}
                    onPress={onRemove}
                    testID={RecurringDetailSelector.RemoveButton}
                    colorClassName="text-destructive-strong"
                />
            </TransactionInfoGroup>
            <Text className="px-3xl text-[13px] text-secondary-foreground">{footnote}</Text>
        </View>
    );
};

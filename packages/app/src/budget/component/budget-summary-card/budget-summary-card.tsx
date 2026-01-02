import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { SummaryRow } from '../summary-row/summary-row';

interface Props {
    readonly plannedFormatted: string;
    readonly spentFormatted: string;
    readonly projectedFormatted: string;
    readonly spentPercent: number;
}

export const BudgetSummaryCard = ({ plannedFormatted, spentFormatted, projectedFormatted, spentPercent }: Props) => {
    const { t } = useLingui();

    return (
        <Card className="gap-2">
            <Text className="text-xs uppercase text-secondary-foreground">
                <Trans>Summary</Trans>
            </Text>

            <SummaryRow label={t`Total Budget`} value={plannedFormatted} />
            <SummaryRow label={t`Total Spent`} value={spentFormatted} />
            <SummaryRow label={t`Projected End`} value={projectedFormatted} />
            <SummaryRow label={t`Budget Usage`} value={`${spentPercent}%`} />
        </Card>
    );
};

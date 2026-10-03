import { AccountDebtTypeEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { DebtAccountCardSummarySelector } from '../debt-account-card-summary/debt-account-card-summary.selector';
import { DebtProgressTrack } from '../debt-progress-track/debt-progress-track';

interface Props {
    readonly debtType: AccountDebtTypeEnum;
    readonly percentage: number;
    readonly title: string;
}

export const DebtAccountCardProgress = ({ debtType, percentage, title }: Props) => {
    const fillClassName = debtType === AccountDebtTypeEnum.BORROW ? 'bg-destructive-foreground' : 'bg-positive-foreground';

    if (!isPositiveNumber(percentage)) {
        return null;
    }

    return (
        <View className="ml-[54px] flex-row items-center gap-x-md">
            <DebtProgressTrack percentage={percentage} className="h-[3px] flex-1 bg-secondary-corner" fillClassName={fillClassName} />
            <Text
                className="shrink-0 text-xs text-secondary-foreground tabular-nums"
                testID={DebtAccountCardSummarySelector.Percentage(title, percentage)}
            >
                <Trans>{percentage}% repaid</Trans>
            </Text>
        </View>
    );
};

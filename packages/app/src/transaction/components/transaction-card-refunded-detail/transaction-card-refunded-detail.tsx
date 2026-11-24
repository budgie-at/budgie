import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useRefundedLabel } from '../../hook/use-refunded-label.hook';
import { TransactionCardStackedSubtitle } from '../transaction-card-stacked-subtitle/transaction-card-stacked-subtitle';
import { TransactionCardSubtitle } from '../transaction-card-subtitle/transaction-card-subtitle';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId: number | null;
    readonly subtitleSegments: readonly string[];
    readonly stackedSegments: readonly string[];
    readonly accountTitle: string | null;
    readonly testID?: string;
}

export const TransactionCardRefundedDetail = ({
    transaction,
    accountId,
    subtitleSegments,
    stackedSegments,
    accountTitle,
    testID
}: Props) => {
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const refundedLabel = useRefundedLabel(transaction);

    const nextSubtitleSegments = [refundedLabel, ...subtitleSegments].filter(isNotEmptyString);
    const nextStackedSegments = [refundedLabel, ...stackedSegments].filter(isNotEmptyString);

    return isAccessibilityTextSize ? (
        <TransactionCardStackedSubtitle
            transaction={transaction}
            segments={nextStackedSegments}
            accountTitle={accountTitle}
            {...(isDefined(testID) && { testID })}
        />
    ) : (
        <TransactionCardSubtitle
            transaction={transaction}
            accountId={accountId}
            segments={nextSubtitleSegments}
            {...(isDefined(testID) && { testID })}
        />
    );
};

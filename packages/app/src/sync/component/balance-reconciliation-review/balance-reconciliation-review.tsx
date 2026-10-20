import { convertFromMicroUnits } from '@budgie/contracts';
import { SyncBalanceReconciliationService } from '@budgie/sync';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { useEffectAction } from '../../../@generic/hook/use-effect-action.hook';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { DEFAULT_DECIMAL_PLACES } from '../../../i18n/constant/default-decimal-places.constant';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { balanceReconciliationReviewAtom } from '../../constant/balance-reconciliation-review-atom.constant';
import { SyncDataRow } from '../sync-data-row/sync-data-row';

interface Props {
    readonly accountId: number;
    readonly instrumentSymbol: string;
}

export const BalanceReconciliationReview = ({ accountId, instrumentSymbol }: Props) => {
    const { t } = useLingui();
    const formatAmount = useFormatDigits(DEFAULT_DECIMAL_PLACES, MICRO_UNIT_DECIMAL_PLACES);
    const { formatDayAndMonthAndYear } = useFormatDate();
    const review = AsyncResult.getOrElse(useLiveAtomValue(balanceReconciliationReviewAtom(accountId)), () => null);
    const [runEffect, isApplying] = useEffectAction(t`Could not apply the bank balance`);

    if (!isDefined(review)) {
        return null;
    }

    const correction = formatAmount(convertFromMicroUnits(review.delta), instrumentSymbol);
    const driftStartRow = isDefined(review.driftStartAt) ? (
        <SyncDataRow label={t`Differs since`} value={formatDayAndMonthAndYear(review.driftStartAt)} />
    ) : null;

    const handleApply = () => {
        runEffect(Effect.flatMap(SyncBalanceReconciliationService, service => service.approve(accountId)));
    };

    return (
        <Card className="gap-y-lg">
            <Text className="text-primary font-semibold text-base">
                <Trans>Balance differs from the bank</Trans>
            </Text>
            <Text className="text-secondary-foreground text-xs">
                <Trans>Applying the bank balance books a correction of {correction}.</Trans>
            </Text>
            {driftStartRow}
            <Button content={t`Apply bank balance`} isLoading={isApplying} onPress={handleApply} size="sm" variant="positive" />
        </Card>
    );
};

import { DepositInterestService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { Button } from '../../../@generic/component/button/button';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { DepositCloseSelector } from '../../../app/deposit-close.selector';
import { useDepositClosePrefillQuery } from '../../query/use-deposit-close-prefill.query';

interface Props {
    readonly depositAccountId: number;
    readonly onLinked: () => void;
}

export const DepositCloseLinkPayoutsButton = ({ depositAccountId, onLinked }: Props) => {
    const { t } = useLingui();
    const { run, isLoading } = useSingleFlight();
    const { prefill } = useDepositClosePrefillQuery(depositAccountId);

    const handleLinkPayouts = () => {
        void run(
            Effect.flatMap(DepositInterestService, service => service.linkInterestPayouts(depositAccountId)).pipe(
                Effect.tap(() => Effect.sync(onLinked)),
                toastOnFailure(t`Could not link payouts`)
            )
        );
    };

    return prefill?.hasUnassignedInterest === true ? (
        <Button
            content={t`Payouts already recorded? Link them`}
            size="sm"
            isLoading={isLoading}
            onPress={handleLinkPayouts}
            testID={DepositCloseSelector.LinkPayoutsButton}
        />
    ) : null;
};

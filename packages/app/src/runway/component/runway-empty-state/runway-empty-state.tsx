import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';

interface Props {
    readonly monthsUsed: number;
}

export const RunwayEmptyState = ({ monthsUsed }: Props) => {
    const { t } = useLingui();

    return (
        <EmptyState
            circleIcon={UserIconNameEnum.CalendarClock}
            title={t`Not enough history yet`}
            description={t`Runway needs at least 3 complete months of transactions. You have ${monthsUsed}.`}
        />
    );
};

import { HouseholdShareService, HouseholdShareStateEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedListSwitchRow } from '../../../@generic/component/grouped-list-switch-row/grouped-list-switch-row';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { HouseholdShareSelector } from '../../../account/component/household-share-account-section/household-share-account-section.selector';
import { householdBudgetShareAtom } from '../../constant/household-budget-share-atom.constant';

interface Props {
    readonly budgetId: number;
}

export const BudgetShareField = ({ budgetId }: Props) => {
    const { t } = useLingui();
    const { run } = useSingleFlight();
    const status = AsyncResult.getOrElse(useLiveAtomValue(householdBudgetShareAtom(budgetId)), () => null);

    const handleChange = (next: boolean) =>
        void run(
            Effect.flatMap(HouseholdShareService, householdShareService =>
                next ? householdShareService.shareBudget(budgetId) : householdShareService.unshareBudget(budgetId)
            ).pipe(toastOnFailure(t`Could not update sharing`))
        );

    if (!isDefined(status) || !status.isAvailable) {
        return null;
    }

    const isSharedByOther = status.state === HouseholdShareStateEnum.SHARED_BY_OTHER;
    const row = isSharedByOther ? (
        <GroupedListRow
            left={<GroupedListIcon icon={UserIconNameEnum.Users} />}
            title={t`Shared with your family`}
            subtitle={t`A family member shares this budget. It counts spending from shared accounts only.`}
            testID={HouseholdShareSelector.BudgetRow}
        />
    ) : (
        <GroupedListSwitchRow
            left={<GroupedListIcon icon={UserIconNameEnum.Users} />}
            title={t`Share with family`}
            subtitle={t`Everyone in your family sees this budget. It counts spending from shared accounts only.`}
            value={status.state === HouseholdShareStateEnum.SHARED_BY_ME}
            testID={HouseholdShareSelector.BudgetRow}
            switchTestID={HouseholdShareSelector.BudgetSwitch}
            onChange={handleChange}
        />
    );

    return <GroupedListSection title={t`Family`}>{row}</GroupedListSection>;
};

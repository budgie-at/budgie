import { HouseholdShareStateEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { householdAccountShareAtom } from '../../constant/household-account-share-atom.constant';
import { householdShareEverythingAtom } from '../../constant/household-share-everything-atom.constant';
import { HouseholdShareAccountRow } from '../household-share-account-row/household-share-account-row';
import { HouseholdShareEverythingRow } from '../household-share-everything-row/household-share-everything-row';

interface Props {
    readonly accountId: number;
    readonly isBankSynced: boolean;
}

export const HouseholdShareAccountSection = ({ accountId, isBankSynced }: Props) => {
    const { t } = useLingui();
    const status = AsyncResult.getOrElse(useLiveAtomValue(householdAccountShareAtom(accountId)), () => null);
    const everything = AsyncResult.getOrElse(useLiveAtomValue(householdShareEverythingAtom), () => null);

    if (!isDefined(status) || !status.isAvailable) {
        return null;
    }

    const isSyncedByOther = isBankSynced && status.state === HouseholdShareStateEnum.SHARED_BY_OTHER && isDefined(status.ownerName);
    const footer = isSyncedByOther ? t`Synced by ${status.ownerName}` : t`Everyone in your family sees everything that is shared.`;

    return (
        <GroupedListSection title={t`Family`} footer={footer}>
            <HouseholdShareAccountRow accountId={accountId} state={status.state} />
            {isDefined(everything) && status.state !== HouseholdShareStateEnum.SHARED_BY_OTHER ? (
                <HouseholdShareEverythingRow isEnabled={everything.isEnabled} />
            ) : null}
        </GroupedListSection>
    );
};

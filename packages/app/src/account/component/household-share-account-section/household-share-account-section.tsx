import { HouseholdShareStateEnum } from '@budgie/contracts';
import { useAtom } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { householdShareEverythingAtom } from '../../../household/constant/household-share-everything-atom.constant';
import { householdAccountShareAtom } from '../../constant/household-account-share-atom.constant';
import { householdAccountShareDraftAtom } from '../../constant/household-account-share-draft-atom.constant';
import { HouseholdShareAccountRow } from '../household-share-account-row/household-share-account-row';
import { HouseholdSharedByEverythingAccountRow } from '../household-shared-by-everything-account-row/household-shared-by-everything-account-row';
import { HouseholdSharedByOtherAccountRow } from '../household-shared-by-other-account-row/household-shared-by-other-account-row';

interface Props {
    readonly accountId: number;
    readonly isBankSynced: boolean;
}

export const HouseholdShareAccountSection = ({ accountId, isBankSynced }: Props) => {
    const { t } = useLingui();
    const status = AsyncResult.getOrElse(useLiveAtomValue(householdAccountShareAtom(accountId)), () => null);
    const everything = AsyncResult.getOrElse(useLiveAtomValue(householdShareEverythingAtom), () => null);
    const [draft, setDraft] = useAtom(householdAccountShareDraftAtom(accountId));
    const { isAvailable } = useICloudAccount();

    if (!isDefined(status) || !status.isAvailable) {
        return null;
    }

    const isSharedByOther = status.state === HouseholdShareStateEnum.SHARED_BY_OTHER;
    const isSharedByEverything = !isSharedByOther && isDefined(everything) && everything.isEnabled;
    const isShared = draft ?? status.state === HouseholdShareStateEnum.SHARED_BY_ME;
    const isToggleable = !isSharedByOther && !isSharedByEverything;
    const isSyncedByOther = isBankSynced && isSharedByOther && isDefined(status.ownerName);
    const sharedFooter = isShared ? t`Turn off to remove it from family devices.` : null;
    const accountFooter = isAvailable ? sharedFooter : t`Starts when you sign in to iCloud.`;
    const ownFooter = isToggleable ? accountFooter : null;
    const footer = isSyncedByOther ? t`Synced by ${status.ownerName}` : ownFooter;

    return (
        <GroupedListSection title={t`Family`} footer={footer}>
            {isSharedByOther ? <HouseholdSharedByOtherAccountRow /> : null}
            {isSharedByEverything ? <HouseholdSharedByEverythingAccountRow /> : null}
            {isToggleable ? <HouseholdShareAccountRow value={isShared} onChange={setDraft} /> : null}
        </GroupedListSection>
    );
};

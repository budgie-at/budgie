import { HouseholdShareStateEnum } from '@budgie/cloud-sync';
import { UserIconNameEnum } from '@budgie/contracts';
import { useAtom } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedListSwitchRow } from '../../../@generic/component/grouped-list-switch-row/grouped-list-switch-row';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { householdShareEverythingAtom } from '../../../household/constant/household-share-everything-atom.constant';
import { HouseholdShareSelector } from '../../../household/constant/household-share.selector';
import { householdAccountShareAtom } from '../../constant/household-account-share-atom.constant';
import { householdAccountShareDraftAtom } from '../../constant/household-account-share-draft-atom.constant';
import { getHouseholdAccountFooter } from '../../utils/get-household-account-footer.util';
import { HouseholdShareAccountRow } from '../household-share-account-row/household-share-account-row';
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
    const isSyncedByOther = isBankSynced && isSharedByOther;
    const { footer, sharedByEverythingReason } = getHouseholdAccountFooter(t, {
        isShared,
        isAvailable,
        isToggleable,
        isSyncedByOther
    });

    return (
        <GroupedListSection title={t`Family`} footer={footer}>
            {isSharedByOther ? <HouseholdSharedByOtherAccountRow /> : null}
            {isSharedByEverything ? (
                <GroupedListSwitchRow
                    left={<GroupedListIcon icon={UserIconNameEnum.Users} />}
                    title={t`Share this account`}
                    subtitle={sharedByEverythingReason}
                    value
                    accessibilityHint={sharedByEverythingReason}
                    testID={HouseholdShareSelector.AccountRow}
                    switchTestID={HouseholdShareSelector.AccountSwitch}
                />
            ) : null}
            {isToggleable ? <HouseholdShareAccountRow value={isShared} onChange={setDraft} /> : null}
        </GroupedListSection>
    );
};

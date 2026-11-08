import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { SettingsRowAccessory } from '../../../settings/components/settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { SettingsWarningSubtitle } from '../../../settings/components/settings-warning-subtitle/settings-warning-subtitle';
import { SettingsRowAccessoryKindEnum } from '../../../settings/enum/settings-row-accessory-kind.enum';
import { householdAccountsOverviewAtom } from '../../constant/household-accounts-overview-atom.constant';
import { householdJoinAtom } from '../../constant/household-join-atom.constant';
import { useHouseholdOrganizerName } from '../../hook/use-household-organizer-name.hook';
import { useHousehold } from '../../hook/use-household.hook';
import { getHouseholdSummaryLabels } from '../../utils/get-household-summary-labels.util';

export const HouseholdMemberSummary = () => {
    const { t } = useLingui();
    const organizerName = useHouseholdOrganizerName();
    const { isReady, isMember } = useHousehold();
    const { isAvailable } = useICloudAccount();
    const { status: joinStatus, ownerDisplayName } = useAtomValue(householdJoinAtom);
    const overview = AsyncResult.getOrElse(useLiveAtomValue(householdAccountsOverviewAtom), () => null);
    const labels = getHouseholdSummaryLabels(t, {
        organizerName,
        isReady,
        isMember,
        isAvailable,
        joinStatus,
        ownerDisplayName,
        sharedCount: overview?.sharedByOthersCount ?? 0
    });
    const subtitle = labels.isPaused ? <SettingsWarningSubtitle>{labels.subtitle}</SettingsWarningSubtitle> : labels.subtitle;

    if (!labels.hasSummary) {
        return null;
    }

    return (
        <GroupedListSection>
            <SettingsRow
                icon={labels.icon}
                variant="ghost"
                title={labels.title}
                subtitle={subtitle}
                right={<SettingsRowAccessory kind={SettingsRowAccessoryKindEnum.ACTION} isLoading={labels.isLoading} />}
                testID={labels.testID}
            />
        </GroupedListSection>
    );
};

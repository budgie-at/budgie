import { HouseholdShareService, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import Animated from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { PRESENCE_ENTERING, PRESENCE_EXITING } from '../../../@generic/constant/presence-motion.constant';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { SettingsSwitchRow } from '../../../settings/components/settings-switch-row/settings-switch-row';
import { householdShareEverythingAtom } from '../../constant/household-share-everything-atom.constant';

import { HouseholdShareEverythingSectionSelector } from './household-share-everything-section.selector';

export const HouseholdShareEverythingSection = () => {
    const { t } = useLingui();
    const everything = AsyncResult.getOrElse(useLiveAtomValue(householdShareEverythingAtom), () => null);
    const { run, isLoading } = useSingleFlight();
    const { isAvailable } = useICloudAccount();

    if (!isDefined(everything) || !everything.isAvailable) {
        return null;
    }

    const handleChange = (next: boolean) =>
        void run(
            Effect.flatMap(HouseholdShareService, householdShareService => householdShareService.setShareEverything(next)).pipe(
                toastOnFailure(t`Could not update sharing`)
            )
        );

    const footer = isAvailable
        ? t`Includes accounts you add later.`
        : t`Includes accounts you add later. Starts when you sign in to iCloud.`;

    return (
        <Animated.View entering={PRESENCE_ENTERING} exiting={PRESENCE_EXITING}>
            <GroupedListSection title={t`Sharing`} footer={footer}>
                <SettingsSwitchRow
                    icon={UserIconNameEnum.Layers}
                    title={t`Share everything`}
                    subtitle={t`Family can edit every account`}
                    value={everything.isEnabled}
                    isLoading={isLoading}
                    testID={HouseholdShareEverythingSectionSelector.Row}
                    switchTestID={HouseholdShareEverythingSectionSelector.Switch}
                    {...(!isLoading && { onChange: handleChange })}
                />
            </GroupedListSection>
        </Animated.View>
    );
};

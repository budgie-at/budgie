import { useLingui } from '@lingui/react/macro';
import Animated, { LayoutAnimationConfig } from 'react-native-reanimated';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { PRESENCE_ENTERING, PRESENCE_EXITING, PRESENCE_LAYOUT } from '../../../@generic/constant/presence-motion.constant';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { CloudSyncRow } from '../../../cloud-sync/component/cloud-sync-row/cloud-sync-row';
import { FamilyRow } from '../../../household/component/family-row/family-row';
import { ICloudBackupRow } from '../icloud-backup-row/icloud-backup-row';
import { ICloudRestoreRow } from '../icloud-restore-row/icloud-restore-row';
import { ICloudSignInRow } from '../icloud-sign-in-row/icloud-sign-in-row';

export const ICloudDataSection = () => {
    const { t } = useLingui();
    const { isAvailable, isLoading } = useICloudAccount();

    const footer = isAvailable ? null : t`iCloud backup, sync and family sharing need an Apple Account. Sign in from the Settings app.`;

    return (
        <LayoutAnimationConfig skipEntering>
            <Animated.View layout={PRESENCE_LAYOUT}>
                <GroupedListSection title={t`iCloud`} footer={footer}>
                    <LoadingContent isLoading={isLoading}>
                        {isAvailable ? (
                            <Animated.View key="signed-in" entering={PRESENCE_ENTERING} exiting={PRESENCE_EXITING} layout={PRESENCE_LAYOUT}>
                                <ICloudBackupRow />
                                <CloudSyncRow />
                                <FamilyRow />
                                <ICloudRestoreRow />
                            </Animated.View>
                        ) : (
                            <Animated.View
                                key="signed-out"
                                entering={PRESENCE_ENTERING}
                                exiting={PRESENCE_EXITING}
                                layout={PRESENCE_LAYOUT}
                            >
                                <ICloudSignInRow />
                                <FamilyRow />
                            </Animated.View>
                        )}
                    </LoadingContent>
                </GroupedListSection>
            </Animated.View>
        </LayoutAnimationConfig>
    );
};

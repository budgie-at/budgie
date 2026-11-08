import { useLingui } from '@lingui/react/macro';
import { Platform } from 'react-native';
import Animated from 'react-native-reanimated';

import { PRESENCE_LAYOUT } from '../../../@generic/constant/presence-motion.constant';
import { IS_CLOUD_BACKUP_SUPPORTED } from '../../../cloud-backup/constant/is-cloud-backup-supported.constant';
import { DeviceDataSection } from '../device-data-section/device-data-section';
import { ICloudDataSection } from '../icloud-data-section/icloud-data-section';

export const YourDataCard = () => {
    const { t } = useLingui();

    const deviceTitle = Platform.OS === 'ios' ? t`On this iPhone` : t`On this phone`;

    if (!IS_CLOUD_BACKUP_SUPPORTED) {
        return <DeviceDataSection title={t`Your data`} />;
    }

    return (
        <>
            <ICloudDataSection />
            <Animated.View layout={PRESENCE_LAYOUT}>
                <DeviceDataSection title={deviceTitle} />
            </Animated.View>
        </>
    );
};

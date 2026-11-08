import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ICloudModule } from '../../../modules/icloud';

export const IS_CLOUD_BACKUP_SUPPORTED =
    Platform.OS === 'ios' && Constants.expoConfig?.extra?.['appVariant'] !== 'e2e' && isDefined(ICloudModule);

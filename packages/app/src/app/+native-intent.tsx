import { getShareExtensionKey } from 'expo-share-intent';

import type { NativeIntent } from 'expo-router';

export const redirectSystemPath: NativeIntent['redirectSystemPath'] = ({ path }) => (path.includes(getShareExtensionKey()) ? null : path);

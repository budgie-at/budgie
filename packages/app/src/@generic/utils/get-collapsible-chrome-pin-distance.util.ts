import { SCREEN_CHROME_HEADER_LAYOUT_METRICS, getScreenChromeHeaderMetrics } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../constant/screen-chrome-content-inset.constant';

export const getCollapsibleChromePinDistance = (anchorY: number, safeTop: number): number =>
    safeTop +
    SCREEN_CHROME_CONTENT_INSET_TOP +
    anchorY -
    getScreenChromeHeaderMetrics(SCREEN_CHROME_HEADER_LAYOUT_METRICS.slotSize, safeTop);

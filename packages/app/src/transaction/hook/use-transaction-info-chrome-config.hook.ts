import { useWindowDimensions } from 'react-native';

import { SCREEN_CHROME_SHARED_DEFAULT_CONFIG } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONFIG } from '../../@generic/constant/screen-chrome-config.constant';
import { TRANSACTION_INFO_ROW_MAX_FONT_SCALE } from '../constant/transaction-info-row-max-font-scale.constant';

import type { ScreenChromeConfigOverridesInterface } from '@rnw-community/react-native-screen-chrome';

const COMPACT_SUMMARY_LINE_HEIGHT = 45;
const COMPACT_SUMMARY_VERTICAL_PADDING = 16;

export const useTransactionInfoChromeConfig = (): ScreenChromeConfigOverridesInterface => {
    const { fontScale } = useWindowDimensions();
    const summaryHeight = Math.ceil(COMPACT_SUMMARY_LINE_HEIGHT * Math.min(fontScale, TRANSACTION_INFO_ROW_MAX_FONT_SCALE));

    return {
        ...SCREEN_CHROME_CONFIG,
        headerHeight: Math.max(SCREEN_CHROME_SHARED_DEFAULT_CONFIG.headerHeight, summaryHeight + COMPACT_SUMMARY_VERTICAL_PADDING)
    };
};

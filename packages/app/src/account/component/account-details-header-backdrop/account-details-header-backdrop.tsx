import { CollapsibleHeaderBackdrop } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../../@generic/constant/screen-chrome-content-inset.constant';
import { SCREEN_CHROME_HEADER_BAND_HEIGHT } from '../../../@generic/constant/screen-chrome-header-band-height.constant';

const SCROLL_ANIMATION = { opacityInputRange: [0, SCREEN_CHROME_CONTENT_INSET_TOP - SCREEN_CHROME_HEADER_BAND_HEIGHT] } as const;

export const AccountDetailsHeaderBackdrop = () => <CollapsibleHeaderBackdrop scrollAnimation={SCROLL_ANIMATION} />;

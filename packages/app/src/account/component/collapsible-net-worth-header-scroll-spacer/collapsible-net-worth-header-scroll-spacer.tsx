import { View } from 'react-native';

import { COLLAPSIBLE_NET_WORTH_HEADER_SCROLL_SPACER_HEIGHT } from '../../constant/collapsible-net-worth-header-scroll-spacer.constant';

import type { ViewStyle } from 'react-native';

const spacerStyle: ViewStyle = { height: COLLAPSIBLE_NET_WORTH_HEADER_SCROLL_SPACER_HEIGHT };

export const CollapsibleNetWorthHeaderScrollSpacer = () => <View pointerEvents="none" style={spacerStyle} />;

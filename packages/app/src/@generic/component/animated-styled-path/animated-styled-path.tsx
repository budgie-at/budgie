import Animated from 'react-native-reanimated';
import { Path } from 'react-native-svg';
import { withUniwind } from 'uniwind';

import { SVG_COLOR_CLASS_NAME_MAPPING } from '../../constant/svg-color-class-name-mapping.constant';

export const AnimatedStyledPath = withUniwind(Animated.createAnimatedComponent(Path), SVG_COLOR_CLASS_NAME_MAPPING);

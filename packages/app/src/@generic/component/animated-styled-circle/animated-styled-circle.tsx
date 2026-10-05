import Animated from 'react-native-reanimated';
import { Circle } from 'react-native-svg';
import { withUniwind } from 'uniwind';

import { SVG_COLOR_CLASS_NAME_MAPPING } from '../../constant/svg-color-class-name-mapping.constant';

export const AnimatedStyledCircle = withUniwind(Animated.createAnimatedComponent(Circle), SVG_COLOR_CLASS_NAME_MAPPING);

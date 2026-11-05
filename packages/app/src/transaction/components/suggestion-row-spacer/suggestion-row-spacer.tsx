import { useWindowDimensions, View } from 'react-native';

import { SUGGESTION_MAX_FONT_SCALE } from '../../constant/suggestion-max-font-scale.constant';
import { SUGGESTION_ROW_HEIGHT } from '../../constant/suggestion-row-height.constant';

export const SuggestionRowSpacer = () => {
    const style = { height: SUGGESTION_ROW_HEIGHT * Math.min(useWindowDimensions().fontScale, SUGGESTION_MAX_FONT_SCALE) };

    return <View style={style} />;
};

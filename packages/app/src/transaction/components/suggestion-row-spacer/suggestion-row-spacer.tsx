import { useWindowDimensions, View } from 'react-native';

import { SUGGESTION_ROW_HEIGHT } from '../../constant/suggestion-row-height.constant';

export const SuggestionRowSpacer = () => {
    const style = { height: SUGGESTION_ROW_HEIGHT * useWindowDimensions().fontScale };

    return <View style={style} />;
};

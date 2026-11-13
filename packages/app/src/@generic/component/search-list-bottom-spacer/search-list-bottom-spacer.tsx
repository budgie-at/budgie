import { View } from 'react-native';

import { useSearchInputBottom } from '../../hook/use-search-input-bottom.hook';
import { SEARCH_LIST_BOTTOM_CLEARANCE } from '../searchable-page/searchable-page.constant';

export const SearchListBottomSpacer = () => {
    const style = { height: useSearchInputBottom() + SEARCH_LIST_BOTTOM_CLEARANCE };

    return <View style={style} />;
};

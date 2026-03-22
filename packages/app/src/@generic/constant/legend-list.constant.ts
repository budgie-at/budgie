import { ViewStyle } from 'react-native';

import { IdInterface } from '../interface/id.interface';

export const LEGEND_LIST_ESTIMATED_ITEM_SIZE = 60;
export const LEGEND_LIST_STYLE: ViewStyle = { flex: 1 };
export const LEGEND_LIST_CONTENT_GAP = 12;
export const LEGEND_LIST_HEADER_HEIGHT = 80;

export const legendListKeyExtractor = (item: IdInterface): string => item.id.toString();

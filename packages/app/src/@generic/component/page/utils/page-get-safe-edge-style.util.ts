import type { ViewStyle } from 'react-native';
import type { Edge, EdgeInsets } from 'react-native-safe-area-context';

export const PAGE_DEFAULT_SAFE_EDGES: Edge[] = ['top'];

export const pageGetSafeEdgeStyle = (safeEdges: Edge[], insets: EdgeInsets): ViewStyle => ({
    ...(safeEdges.includes('top') ? { paddingTop: insets.top } : {}),
    ...(safeEdges.includes('left') ? { paddingLeft: insets.left } : {}),
    ...(safeEdges.includes('right') ? { paddingRight: insets.right } : {}),
    ...(safeEdges.includes('bottom') ? { paddingBottom: insets.bottom } : {})
});

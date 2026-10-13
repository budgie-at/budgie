import type { Edge } from 'react-native-safe-area-context';

export const PAGE_DEFAULT_SAFE_EDGES: Edge[] = ['top'];

const SAFE_EDGE_CLASS_NAME: Record<Edge, string> = {
    top: 'pt-safe',
    left: 'pl-safe',
    right: 'pr-safe',
    bottom: 'pb-safe'
};

export const pageGetSafeEdgeClassName = (safeEdges: Edge[]): string => safeEdges.map(edge => SAFE_EDGE_CLASS_NAME[edge]).join(' ');

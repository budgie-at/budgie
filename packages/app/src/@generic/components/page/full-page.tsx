import { ComponentProps } from 'react';
import { Edge } from 'react-native-safe-area-context';

import { Page } from './page';

const safeEdges: Edge[] = ['bottom', 'top'];

export const FullPage = (props: ComponentProps<typeof Page>) => <Page {...props} safeEdges={safeEdges} />;

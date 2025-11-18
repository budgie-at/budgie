import { ComponentProps } from 'react';
import { Edges } from 'react-native-safe-area-context';

import { Page } from './page';

const safeEdges: Edges = ['bottom', 'top']

export const FullPage = (props: ComponentProps<typeof Page>) => <Page {...props} safeEdges={safeEdges} />

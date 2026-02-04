import { ComponentProps } from 'react';
import { Edge } from 'react-native-safe-area-context';

import { Page } from './page';

const safeEdges: Edge[] = ['top', 'bottom'];

export const ModalPage = (props: ComponentProps<typeof Page>) => <Page {...props} safeEdges={safeEdges} />;

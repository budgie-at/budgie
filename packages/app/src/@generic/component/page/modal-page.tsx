import { cn } from 'cn';
import { ComponentProps } from 'react';
import { Edge } from 'react-native-safe-area-context';

import { Page } from './page';

const safeEdges: Edge[] = ['bottom'];

export const ModalPage = ({ className, ...rest }: ComponentProps<typeof Page>) => (
    <Page {...rest} className={cn('pt-xl', className)} safeEdges={safeEdges} />
);

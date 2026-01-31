import { ComponentProps } from 'react';
import { Keyboard, Pressable } from 'react-native';
import { Edge } from 'react-native-safe-area-context';

import { cn } from '../../utils/cn.util';

import { Page } from './page';

const safeEdges: Edge[] = ['bottom'];

const dismissKeyboard = (): void => {
    Keyboard.dismiss();
};

export const ModalPage = ({ className, children, ...rest }: ComponentProps<typeof Page>) => (
    <Page {...rest} className={cn('pt-3xl', className)} safeEdges={safeEdges}>
        <Pressable onPress={dismissKeyboard} className="flex-1">
            {children}
        </Pressable>
    </Page>
);

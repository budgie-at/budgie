import { createContext, useContext, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { AnimatedActionMenu } from './animated-action-menu';

import type { AnimatedActionItemInterface } from './animated-action-item.interface';
import type { PropsWithChildren } from 'react';

interface AnimatedActionMenuContextInterface {
    readonly open: (items: AnimatedActionItemInterface[]) => void;
    readonly close: () => void;
}

const AnimatedActionMenuContext = createContext<AnimatedActionMenuContextInterface | null>(null);

export const AnimatedActionMenuProvider = ({ children }: PropsWithChildren) => {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<AnimatedActionItemInterface[]>([]);

    const open = (newItems: AnimatedActionItemInterface[]) => {
        setItems(newItems);
        setIsOpen(true);
    };

    const close = () => {
        setIsOpen(false);
    };

    const value = { open, close };

    return (
        <AnimatedActionMenuContext value={value}>
            {children}
            <AnimatedActionMenu isOpen={isOpen} onClose={close} items={items} />
        </AnimatedActionMenuContext>
    );
};

export const useAnimatedActionMenu = (): AnimatedActionMenuContextInterface => {
    const context = useContext(AnimatedActionMenuContext);

    if (!isDefined(context)) {
        // eslint-disable-next-line lingui/no-unlocalized-strings
        throw new Error('useAnimatedActionMenu must be used within a AnimatedActionMenuProvider');
    }

    return context;
};

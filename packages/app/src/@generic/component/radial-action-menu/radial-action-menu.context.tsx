import { createContext, useContext, useState } from 'react';

import { RadialActionMenu } from './radial-action-menu';

import type { RadialActionItemInterface } from './radial-action-item.interface';
import type { PropsWithChildren } from 'react';

interface RadialActionMenuContextInterface {
    readonly open: (items: RadialActionItemInterface[]) => void;
    readonly close: () => void;
}

const RadialActionMenuContext = createContext<RadialActionMenuContextInterface | undefined>(undefined);

export const RadialActionMenuProvider = ({ children }: PropsWithChildren) => {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<RadialActionItemInterface[]>([]);

    const open = (newItems: RadialActionItemInterface[]) => {
        setItems(newItems);
        setIsOpen(true);
    };

    const close = () => {
        setIsOpen(false);
    };

    return (
        <RadialActionMenuContext value={{ open, close }}>
            {children}
            <RadialActionMenu isOpen={isOpen} onClose={close} items={items} />
        </RadialActionMenuContext>
    );
};

export const useRadialActionMenu = (): RadialActionMenuContextInterface => {
    const context = useContext(RadialActionMenuContext);

    if (context === undefined) {
        throw new Error('useRadialActionMenu must be used within a RadialActionMenuProvider');
    }

    return context;
};

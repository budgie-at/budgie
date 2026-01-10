import { createContext, useContext, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import type { PropsWithChildren } from 'react';

interface AnimatedActionMenuContextInterface {
    readonly isOpen: boolean;
    readonly open: () => void;
    readonly close: () => void;
}

const AnimatedActionMenuContext = createContext<AnimatedActionMenuContextInterface | null>(null);

export const AnimatedActionMenuProvider = ({ children }: PropsWithChildren) => {
    const [isOpen, setIsOpen] = useState(false);

    const open = () => void setIsOpen(true);
    const close = () => void setIsOpen(false);

    const value = { isOpen, open, close };

    return <AnimatedActionMenuContext value={value}>{children}</AnimatedActionMenuContext>;
};

export const useAnimatedActionMenu = (): AnimatedActionMenuContextInterface => {
    const context = useContext(AnimatedActionMenuContext);

    if (!isDefined(context)) {
        throw new Error('useAnimatedActionMenu must be used within a AnimatedActionMenuProvider'); // eslint-disable-line lingui/no-unlocalized-strings
    }

    return context;
};

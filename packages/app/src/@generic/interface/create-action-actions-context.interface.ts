import type { CreateActionInterface } from './create-action.interface';

export interface CreateActionActionsContextInterface {
    readonly setCreateAction: (action: CreateActionInterface | null) => void;
    readonly openMenu: () => void;
    readonly setIsMenuOpen: (isOpen: boolean) => void;
}

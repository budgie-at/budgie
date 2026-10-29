import { PopoverAnimationActionTypeEnum } from '../enum/popover-animation-action-type.enum';

export type PopoverAnimationActionInterface =
    | { readonly type: PopoverAnimationActionTypeEnum.OPEN_CHANGED; readonly isOpen: boolean }
    | { readonly type: PopoverAnimationActionTypeEnum.CLOSE_ANIMATION_FINISHED }
    | { readonly type: PopoverAnimationActionTypeEnum.NATIVE_DISMISSED };

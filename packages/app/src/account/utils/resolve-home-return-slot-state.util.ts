import { HomeReturnSlotStateEnum } from '../enum/home-return-slot-state.enum';

export const resolveHomeReturnSlotState = (
    isSuppressed: boolean,
    isStacked: boolean,
    isPending: boolean,
    isEmpty: boolean
): HomeReturnSlotStateEnum => {
    if (isSuppressed) {
        return isStacked ? HomeReturnSlotStateEnum.ABSENT : HomeReturnSlotStateEnum.RESERVED;
    }

    if (isPending) {
        return HomeReturnSlotStateEnum.PENDING;
    }

    return isEmpty ? HomeReturnSlotStateEnum.RESERVED : HomeReturnSlotStateEnum.SHOWN;
};

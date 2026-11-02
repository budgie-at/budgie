import { PinFormStatusEnum } from '../enum/pin-form-status.enum';

export const getPinFormStatus = (isLoading: boolean, isLocked: boolean, isAccepted = false): PinFormStatusEnum => {
    if (isAccepted) {
        return PinFormStatusEnum.ACCEPTED;
    }

    if (isLoading) {
        return PinFormStatusEnum.BUSY;
    }

    return isLocked ? PinFormStatusEnum.LOCKED : PinFormStatusEnum.READY;
};

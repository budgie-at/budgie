import { CreateMonobankAccountActionTypeEnum } from '../enum/create-monobank-account-action-type.enum';
import { SetupStepEnum } from '../enum/setup-step.enum';

import type { CreateMonobankAccountActionInterface } from '../interface/create-monobank-account-action.interface';
import type { CreateMonobankAccountStateInterface } from '../interface/create-monobank-account-state.interface';

export const createMonobankAccountReducer = (
    state: CreateMonobankAccountStateInterface,
    action: CreateMonobankAccountActionInterface
): CreateMonobankAccountStateInterface => {
    if (action.type === CreateMonobankAccountActionTypeEnum.TOKEN_CHANGED) {
        return { ...state, token: action.token };
    }
    if (action.type === CreateMonobankAccountActionTypeEnum.HISTORY_DEPTH_SELECTED) {
        return { ...state, historyDepth: action.historyDepth };
    }
    if (action.type === CreateMonobankAccountActionTypeEnum.ACCOUNTS_FETCHED) {
        return { ...state, step: SetupStepEnum.ACCOUNTS };
    }
    if (action.type === CreateMonobankAccountActionTypeEnum.CONTINUED_TO_HISTORY) {
        return { ...state, step: SetupStepEnum.HISTORY };
    }

    return { ...state, step: state.step === SetupStepEnum.HISTORY ? SetupStepEnum.ACCOUNTS : SetupStepEnum.TOKEN };
};

import { CreateBinanceAccountActionTypeEnum } from '../enum/create-binance-account-action-type.enum';
import { SetupStepEnum } from '../enum/setup-step.enum';

import type { CreateBinanceAccountActionInterface } from '../interface/create-binance-account-action.interface';
import type { CreateBinanceAccountStateInterface } from '../interface/create-binance-account-state.interface';

export const createBinanceAccountReducer = (
    state: CreateBinanceAccountStateInterface,
    action: CreateBinanceAccountActionInterface
): CreateBinanceAccountStateInterface => {
    if (action.type === CreateBinanceAccountActionTypeEnum.API_KEY_CHANGED) {
        return { ...state, apiKey: action.apiKey };
    }
    if (action.type === CreateBinanceAccountActionTypeEnum.API_SECRET_CHANGED) {
        return { ...state, apiSecret: action.apiSecret };
    }

    return { ...state, step: SetupStepEnum.ACCOUNTS, parkedPreviews: action.parkedPreviews };
};

import { BinanceSyncTokenSectionActionTypeEnum } from '../enum/binance-sync-token-section-action-type.enum';

import type { BinanceSyncTokenSectionActionInterface } from '../interface/binance-sync-token-section-action.interface';
import type { BinanceSyncTokenSectionStateInterface } from '../interface/binance-sync-token-section-state.interface';

export const binanceSyncTokenSectionReducer = (
    state: BinanceSyncTokenSectionStateInterface,
    action: BinanceSyncTokenSectionActionInterface
): BinanceSyncTokenSectionStateInterface => {
    if (action.type === BinanceSyncTokenSectionActionTypeEnum.EDIT_STARTED) {
        return { isEditing: true, apiKey: action.apiKey, apiSecret: action.apiSecret };
    }
    if (action.type === BinanceSyncTokenSectionActionTypeEnum.API_KEY_CHANGED) {
        return { ...state, apiKey: action.apiKey };
    }
    if (action.type === BinanceSyncTokenSectionActionTypeEnum.API_SECRET_CHANGED) {
        return { ...state, apiSecret: action.apiSecret };
    }

    return { isEditing: false, apiKey: '', apiSecret: '' };
};

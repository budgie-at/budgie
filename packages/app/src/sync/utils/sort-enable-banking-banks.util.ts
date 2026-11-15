import * as Arr from 'effect/Array';
import * as Order from 'effect/Order';

import { getDeviceRegionCode } from './get-device-region-code.util';

import type { EnableBankingBankInterface } from '@budgie/sync';

export const sortEnableBankingBanks = (banks: readonly EnableBankingBankInterface[]): EnableBankingBankInterface[] => {
    const regionCode = getDeviceRegionCode();

    return Arr.sort(
        banks,
        Order.combine(
            Order.mapInput(Order.Boolean, (bank: EnableBankingBankInterface) => bank.country !== regionCode),
            Order.mapInput(Order.String, (bank: EnableBankingBankInterface) => bank.name.toLocaleLowerCase())
        )
    );
};

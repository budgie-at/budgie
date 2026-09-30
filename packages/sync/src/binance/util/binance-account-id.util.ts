import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { isNotEmptyString } from '@rnw-community/shared';

import { BinanceWalletEnum } from '../enum/binance-wallet.enum';

import type { BinanceAccountIdInterface } from '../interface/binance-account-id.interface';

const BINANCE_ACCOUNT_ID_SEPARATOR = ':';

const decodeBinanceAccountIdParts = Schema.decodeUnknownOption(
    Schema.Struct({
        wallet: Schema.Enum(BinanceWalletEnum),
        asset: Schema.NonEmptyString
    })
);

export const encodeBinanceAccountId = (accountId: BinanceAccountIdInterface): string =>
    `${accountId.wallet}${BINANCE_ACCOUNT_ID_SEPARATOR}${accountId.asset}`;

export const decodeBinanceAccountId = (accountId: string): BinanceAccountIdInterface | null => {
    const separatorIndex = accountId.indexOf(BINANCE_ACCOUNT_ID_SEPARATOR);

    if (separatorIndex < 0) {
        return null;
    }

    const wallet = accountId.slice(0, separatorIndex);
    const asset = accountId.slice(separatorIndex + 1);

    if (!isNotEmptyString(asset)) {
        return null;
    }

    return Option.getOrNull(decodeBinanceAccountIdParts({ wallet, asset }));
};

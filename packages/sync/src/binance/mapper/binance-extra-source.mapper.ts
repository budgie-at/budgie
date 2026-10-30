import { convertFromMicroUnits } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { SyncTransactionTypeEnum } from '../../core/enum/sync-transaction-type.enum';
import { BinanceEarnRewardKindEnum } from '../enum/binance-earn-reward-kind.enum';
import { BinanceTransferSourceEnum } from '../enum/binance-transfer-source.enum';
import { parseBinanceScaledDecimal } from '../utils/parse-binance-scaled-decimal.util';

import { encodeSpotAccountId, parseUnsignedAmount, toSyncTransaction, toUnixSeconds } from './binance.mapper';

import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { BinanceDividendApiInterface } from '../interface/binance-dividend-api.schema';
import type { BinanceDustLogApiInterface } from '../interface/binance-dust-api.schema';
import type { BinanceEarnDailyTotalInterface } from '../interface/binance-earn-daily-total.interface';
import type { BinanceEarnRewardApiInterface } from '../interface/binance-earn-reward-api.schema';
import type { BinanceTransferInterface } from '../interface/binance-transfer.interface';

const MICRO_UNITS_DECIMALS = 6;
const EARN_RAW_DECIMALS = 18;
const EARN_RAW_PER_MICRO_UNIT = BigInt(10) ** BigInt(EARN_RAW_DECIMALS - MICRO_UNITS_DECIMALS);
const EARN_ROUNDING_HALF = EARN_RAW_PER_MICRO_UNIT / BigInt(2);
const EARN_DATE_PART_DIGITS = 2;
const DUST_DEFAULT_TARGET_ASSET = 'BNB';
const DEBITED_DIVIDEND_DIRECTION = -1;

const EARN_REWARD_KIND_LABELS: Record<BinanceEarnRewardKindEnum, { readonly idPrefix: string; readonly label: string }> = {
    [BinanceEarnRewardKindEnum.FLEXIBLE]: { idPrefix: 'binance:earn', label: 'Earn reward' },
    [BinanceEarnRewardKindEnum.LOCKED]: { idPrefix: 'binance:earn-locked', label: 'Locked Earn reward' },
    [BinanceEarnRewardKindEnum.ETH_STAKING]: { idPrefix: 'binance:eth-staking', label: 'ETH staking reward' }
};

const buildEarnDayKey = (timeMs: number): string => {
    const date = new Date(timeMs);
    const month = `${date.getUTCMonth() + 1}`.padStart(EARN_DATE_PART_DIGITS, '0');
    const day = `${date.getUTCDate()}`.padStart(EARN_DATE_PART_DIGITS, '0');

    return `${date.getUTCFullYear()}-${month}-${day}`;
};

export const mapBinanceEarnRewardsToTransactions = (
    asset: string,
    accountId: string,
    rewards: readonly BinanceEarnRewardApiInterface[],
    kind: BinanceEarnRewardKindEnum = BinanceEarnRewardKindEnum.FLEXIBLE
): SyncTransactionInterface[] => {
    const { idPrefix, label } = EARN_REWARD_KIND_LABELS[kind];
    const dailyTotals = new Map<string, BinanceEarnDailyTotalInterface>();
    for (const reward of rewards) {
        const dayKey = buildEarnDayKey(reward.time);
        const rawAmount = parseBinanceScaledDecimal(reward.rewards, EARN_RAW_DECIMALS);
        const dailyTotal = dailyTotals.get(dayKey) ?? { totalRaw: BigInt(0), lastRewardTime: 0 };
        dailyTotals.set(dayKey, {
            totalRaw: isDefined(rawAmount) && rawAmount > BigInt(0) ? dailyTotal.totalRaw + rawAmount : dailyTotal.totalRaw,
            lastRewardTime: Math.max(dailyTotal.lastRewardTime, reward.time)
        });
    }

    return [...dailyTotals.entries()]
        .map(([dayKey, dailyTotal]) => ({
            dayKey,
            lastRewardTime: dailyTotal.lastRewardTime,
            totalMicroUnits: (dailyTotal.totalRaw + EARN_ROUNDING_HALF) / EARN_RAW_PER_MICRO_UNIT
        }))
        .filter(({ totalMicroUnits }) => totalMicroUnits > BigInt(0))
        .map(({ dayKey, lastRewardTime, totalMicroUnits }) =>
            toSyncTransaction({
                id: `${idPrefix}:${asset}:${dayKey}`,
                accountId,
                category: asset,
                time: toUnixSeconds(lastRewardTime),
                type: SyncTransactionTypeEnum.INCOME,
                description: `Binance ${label} ${asset}`,
                amount: convertFromMicroUnits(Number(totalMicroUnits)),
                feeAmount: 0
            })
        );
};

export const mapBinanceDividendToTransaction = (
    dividend: BinanceDividendApiInterface,
    accountId: string
): SyncTransactionInterface | null => {
    const amount = parseUnsignedAmount(dividend.amount);

    return isDefined(amount) && dividend.direction !== DEBITED_DIVIDEND_DIRECTION
        ? toSyncTransaction({
              id: `binance:dividend:${dividend.tranId}`,
              accountId,
              category: dividend.asset,
              time: toUnixSeconds(dividend.divTime),
              type: SyncTransactionTypeEnum.INCOME,
              description: `Binance ${dividend.asset} dividend`,
              amount,
              feeAmount: 0
          })
        : null;
};

export const mapBinanceDustLogToTransfers = (dustLog: BinanceDustLogApiInterface): BinanceTransferInterface[] =>
    dustLog.userAssetDribbletDetails
        .map((detail): BinanceTransferInterface | null => {
            const fromAmount = parseUnsignedAmount(detail.amount);
            const toAmount = parseUnsignedAmount(detail.transferedAmount);
            const feeAmount = parseUnsignedAmount(detail.serviceChargeAmount);
            const targetAsset = detail.targetAsset ?? DUST_DEFAULT_TARGET_ASSET;

            return isDefined(fromAmount) && isDefined(toAmount) && isDefined(feeAmount)
                ? {
                      externalId: `binance:dust:${dustLog.transId}:${detail.fromAsset}`,
                      fromAssetAccountId: encodeSpotAccountId(detail.fromAsset),
                      toAssetAccountId: encodeSpotAccountId(targetAsset),
                      fromAmount,
                      toAmount,
                      feeAssetAccountId: encodeSpotAccountId(targetAsset),
                      feeAmount,
                      time: toUnixSeconds(detail.operateTime),
                      description: `Binance dust ${detail.fromAsset} to ${targetAsset}`,
                      source: BinanceTransferSourceEnum.DUST
                  }
                : null;
        })
        .filter(isDefined);

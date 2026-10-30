import { createHmac } from 'node:crypto';

import * as Effect from 'effect/Effect';

const API_BASE_URL = 'https://api.binance.com';
const DAY_MS = 86_400_000;
const CAPITAL_WINDOW_MS = 90 * DAY_MS;
const THIRTY_DAYS_MS = 30 * DAY_MS;
const RECV_WINDOW_MS = 60_000;
const TICKER_PATTERN = /^[A-Z0-9]{2,12}$/;
const QUOTE_ASSETS = ['USDT', 'FDUSD', 'USDC', 'BTC', 'BNB', 'EUR'];
const FALLBACK_BASE_ASSETS = ['BTC', 'ETH', 'BNB'];
const MAX_TRADED_SYMBOLS = 4;
const MAX_CANDIDATE_SYMBOLS = 40;
const REWARD_LOOKBACK_WINDOWS = 6;
const DUST_LOOKBACK_WINDOWS = 4;
const FIAT_TRANSACTION_TYPES = [0, 1];
const FIAT_CALL_SPACING = '31 seconds';
const AMOUNT_TOLERANCE = 1e-8;
const WITHDRAWAL_COMPLETED_STATUS = 6;
const REWARD_ENDPOINTS = [
    { name: 'locked-rewards', endpoint: '/sapi/v1/simple-earn/locked/history/rewardsRecord' },
    { name: 'eth-staking-rewards', endpoint: '/sapi/v1/eth-staking/eth/history/rewardsHistory' }
];

const apiKey = process.env['BINANCE_API_KEY'] ?? '';
const apiSecret = process.env['BINANCE_API_SECRET'] ?? '';
const fiatWindowCount = Number(process.env['PROBE_FIAT_WINDOWS'] ?? '2');
let serverOffsetMs = 0;

const isRecord = value => typeof value === 'object' && value !== null && !Array.isArray(value);
const toRecord = value => (isRecord(value) ? value : {});
const toRows = value => (Array.isArray(value) ? value.filter(isRecord) : []);
const serverNow = () => Date.now() + serverOffsetMs;
const keyList = value => Object.keys(toRecord(value)).sort().join(',');
const numberOf = value => Number(value ?? Number.NaN);
const isClose = (left, right) => Math.abs(left - right) <= AMOUNT_TOLERANCE * Math.max(1, Math.abs(left), Math.abs(right));
const sum = values => values.reduce((total, value) => total + value, 0);
const yesNo = condition => (condition ? 'yes' : 'no');
const log = line => Effect.sync(() => console.log(line));

const extractRows = body => {
    const record = toRecord(body);
    const rowsKey = ['rows', 'data', 'list', 'userAssetDribblets'].find(key => Array.isArray(record[key]));

    return Array.isArray(body) ? toRows(body) : toRows(rowsKey === undefined ? [] : record[rowsKey]);
};

const parseJson = text => {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
};

const errorCodeOf = response => {
    const code = toRecord(response.body)['code'];

    return code === undefined ? `http-${response.status}` : String(code);
};

const call = (endpoint, params = {}, method = 'GET') =>
    Effect.tryPromise({
        try: async () => {
            const query = Object.entries({ ...params, recvWindow: RECV_WINDOW_MS, timestamp: serverNow() })
                .map(([key, value]) => `${key}=${String(value)}`)
                .join('&');
            const signature = createHmac('sha256', apiSecret).update(query).digest('hex');
            const response = await fetch(`${API_BASE_URL}${endpoint}?${query}&signature=${signature}`, {
                method,
                headers: { 'X-MBX-APIKEY': apiKey }
            });

            return { status: response.status, body: parseJson(await response.text()) };
        },
        catch: () => 'network'
    }).pipe(Effect.catch(() => Effect.succeed({ status: 0, body: null })));

const callPublic = endpoint =>
    Effect.tryPromise({
        try: async () => parseJson(await (await fetch(`${API_BASE_URL}${endpoint}`)).text()),
        catch: () => 'network'
    }).pipe(Effect.catch(() => Effect.succeed(null)));

const syncServerTime = Effect.gen(function* () {
    const timeBody = toRecord(yield* callPublic('/api/v3/time'));
    serverOffsetMs = Number.isFinite(timeBody['serverTime']) ? timeBody['serverTime'] - Date.now() : 0;
});

const fetchWindows = (endpoint, params, windowMs, windowCount, stopWhenRows) =>
    Effect.gen(function* () {
        const collected = { rows: [], envelope: {}, errorCode: null };
        for (let index = 0; index < windowCount; index += 1) {
            const endTime = serverNow() - index * windowMs - (index === 0 ? 0 : 1);
            const response = yield* call(endpoint, { ...params, startTime: endTime - windowMs + 1, endTime });
            if (response.status !== 200) {
                collected.errorCode = errorCodeOf(response);
                break;
            }
            collected.envelope = toRecord(response.body);
            collected.rows.push(...extractRows(response.body));
            if (stopWhenRows && collected.rows.length > 0) {
                break;
            }
        }

        return collected;
    });

const probeCapitalWindow = Effect.gen(function* () {
    const endTime = serverNow();
    const exact = yield* call('/sapi/v1/capital/deposit/hisrec', { startTime: endTime - CAPITAL_WINDOW_MS, endTime, limit: 1 });
    const over = yield* call('/sapi/v1/capital/deposit/hisrec', { startTime: endTime - CAPITAL_WINDOW_MS - 1, endTime, limit: 1 });
    yield* log(`Q1 capital-history window of exactly 90d accepted: ${exact.status === 200 ? 'yes' : `no (${errorCodeOf(exact)})`}`);
    yield* log(`Q1 capital-history window of 90d+1ms accepted: ${over.status === 200 ? 'yes' : `no (${errorCodeOf(over)})`}`);
});

const listTradeSymbolCandidates = Effect.gen(function* () {
    const balances = yield* call('/sapi/v3/asset/getUserAsset', {}, 'POST');
    const assets = [...new Set([...toRows(balances.body).map(row => String(row['asset'])), ...FALLBACK_BASE_ASSETS])];

    return assets
        .flatMap(asset => QUOTE_ASSETS.filter(quote => quote !== asset).map(quote => `${asset}${quote}`))
        .slice(0, MAX_CANDIDATE_SYMBOLS);
});

const probeTradeWindow = Effect.gen(function* () {
    const symbols = yield* listTradeSymbolCandidates;
    const traded = [];
    for (const symbol of symbols) {
        if (traded.length >= MAX_TRADED_SYMBOLS) {
            break;
        }
        const baseline = yield* call('/api/v3/myTrades', { symbol, limit: 1000 });
        const trades = baseline.status === 200 ? toRows(baseline.body) : [];
        if (trades.length > 0) {
            const times = trades.map(trade => numberOf(trade['time']));
            traded.push({
                symbol,
                baselineCount: trades.length,
                oldestMs: Math.min(...times),
                spanMs: Math.max(...times) - Math.min(...times)
            });
        }
    }
    const best = traded.sort((left, right) => right.spanMs - left.spanMs)[0];
    if (best === undefined || best.spanMs <= DAY_MS) {
        yield* log('Q2 startTime-only myTrades limited to 24h: unknown (no symbol with more than 24h of trade history found)');

        return;
    }
    const startTime = best.oldestMs - 1;
    const startOnly = toRows((yield* call('/api/v3/myTrades', { symbol: best.symbol, startTime, limit: 1000 })).body);
    const windowed = toRows(
        (yield* call('/api/v3/myTrades', { symbol: best.symbol, startTime, endTime: startTime + DAY_MS, limit: 1000 })).body
    );
    const startOnlyTimes = startOnly.map(trade => numberOf(trade['time']));
    const startOnlySpanMs = startOnly.length > 0 ? Math.max(...startOnlyTimes) - Math.min(...startOnlyTimes) : 0;
    yield* log(`Q2 startTime-only myTrades limited to 24h: ${yesNo(startOnly.length > 0 && startOnlySpanMs <= DAY_MS)}`);
    yield* log(`Q2 counts: last-1000=${best.baselineCount} startTime-only=${startOnly.length} startTime+24h-endTime=${windowed.length}`);
});

const probeWithdrawalFee = Effect.gen(function* () {
    const endTime = serverNow();
    const window = { startTime: endTime - CAPITAL_WINDOW_MS + 1, endTime, limit: 1000 };
    const withdrawals = toRows((yield* call('/sapi/v1/capital/withdraw/history', window)).body).filter(
        row => row['status'] === WITHDRAWAL_COMPLETED_STATUS && numberOf(row['transactionFee']) > 0
    );
    const deposits = toRows((yield* call('/sapi/v1/capital/deposit/hisrec', window)).body);
    const matches = withdrawals.flatMap(withdrawal => {
        const deposit = deposits.find(candidate => typeof candidate['txId'] === 'string' && candidate['txId'] === withdrawal['txId']);

        return deposit === undefined ? [] : [{ withdrawal, received: numberOf(deposit['amount']) }];
    });
    const includesFee = matches.filter(({ withdrawal, received }) =>
        isClose(received, numberOf(withdrawal['amount']) - numberOf(withdrawal['transactionFee']))
    );
    const excludesFee = matches.filter(({ withdrawal, received }) => isClose(received, numberOf(withdrawal['amount'])));
    const answer =
        includesFee.length > 0 && excludesFee.length === 0 ? 'yes' : excludesFee.length > 0 && includesFee.length === 0 ? 'no' : 'unknown';
    yield* log(
        `Q3 withdrawal amount includes transactionFee: ${answer} (fee-bearing withdrawals=${withdrawals.length} matched-to-own-deposit=${matches.length})`
    );
    if (answer === 'unknown') {
        yield* log(
            'Q3 manual check: open a withdrawal with a fee in the Binance UI; amount includes the fee when Receive Amount = Amount - Fee, and excludes it when Receive Amount = Amount'
        );
    }
});

const probeFiatStatuses = Effect.gen(function* () {
    const statuses = new Set();
    const errorCodes = new Set();
    let isFirstCall = true;
    for (const transactionType of FIAT_TRANSACTION_TYPES) {
        for (let index = 0; index < fiatWindowCount; index += 1) {
            if (!isFirstCall) {
                yield* Effect.sleep(FIAT_CALL_SPACING);
            }
            isFirstCall = false;
            const endTime = serverNow() - index * THIRTY_DAYS_MS;
            const response = yield* call('/sapi/v1/fiat/orders', {
                transactionType,
                beginTime: endTime - THIRTY_DAYS_MS + 1,
                endTime,
                page: 1,
                rows: 500
            });
            if (response.status === 200) {
                toRows(toRecord(response.body)['data']).forEach(order => statuses.add(String(order['status'])));
            } else {
                errorCodes.add(errorCodeOf(response));
            }
        }
    }
    yield* log(
        `Q4 fiat order statuses seen (last ${fiatWindowCount * 30}d, deposits+withdrawals): ${[...statuses].sort().join(' | ') || 'none'}`
    );
    if (errorCodes.size > 0) {
        yield* log(`Q4 fiat errors: ${[...errorCodes].join(',')}`);
    }
});

const probeRewardFields = Effect.gen(function* () {
    for (const { name, endpoint } of REWARD_ENDPOINTS) {
        const result = yield* fetchWindows(endpoint, { current: 1, size: 10 }, THIRTY_DAYS_MS, REWARD_LOOKBACK_WINDOWS, true);
        if (result.errorCode !== null) {
            yield* log(`Q5 ${name}: error ${result.errorCode}`);
            continue;
        }
        const [firstRow] = result.rows;
        const tickers = Object.entries(toRecord(firstRow))
            .filter(([key, value]) => /asset/i.test(key) && typeof value === 'string' && TICKER_PATTERN.test(value))
            .map(([key, value]) => `${key}=${value}`);
        yield* log(
            `Q5 ${name}: envelope keys [${keyList(result.envelope)}] row keys [${keyList(firstRow)}] asset values [${tickers.join(',')}] rows found=${result.rows.length > 0}`
        );
    }
});

const probeDust = Effect.gen(function* () {
    const result = yield* fetchWindows(
        '/sapi/v1/asset/dribblet',
        { accountType: 'SPOT' },
        CAPITAL_WINDOW_MS - 1,
        DUST_LOOKBACK_WINDOWS,
        true
    );
    if (result.errorCode !== null) {
        yield* log(`Q6 dust: error ${result.errorCode}`);

        return;
    }
    const logs = result.rows.filter(row => Array.isArray(row['userAssetDribbletDetails']));
    const details = row => toRows(row['userAssetDribbletDetails']);
    const [firstLog] = logs;
    yield* log(
        `Q6 dust: envelope keys [${keyList(result.envelope)}] log keys [${keyList(firstLog)}] detail keys [${keyList(details(firstLog ?? {})[0])}]`
    );
    if (logs.length === 0) {
        yield* log('Q6 dust gross/net relation: unknown (no dust conversions found)');

        return;
    }
    const sumMatches = (getAmount, totalKey) => logs.every(row => isClose(sum(details(row).map(getAmount)), numberOf(row[totalKey])));
    const transferedSumMatches = sumMatches(detail => numberOf(detail['transferedAmount']), 'totalTransferedAmount');
    const serviceSumMatches = sumMatches(detail => numberOf(detail['serviceChargeAmount']), 'totalServiceChargeAmount');
    const grossSumMatches = sumMatches(
        detail => numberOf(detail['transferedAmount']) + numberOf(detail['serviceChargeAmount']),
        'totalTransferedAmount'
    );
    yield* log(
        `Q6 dust: sum(transferedAmount)==totalTransferedAmount: ${yesNo(transferedSumMatches)}; sum(serviceChargeAmount)==totalServiceChargeAmount: ${yesNo(serviceSumMatches)}; sum(transferedAmount+serviceChargeAmount)==totalTransferedAmount: ${yesNo(grossSumMatches)}`
    );
});

const probeP2p = Effect.gen(function* () {
    const orders = [];
    for (const tradeType of ['BUY', 'SELL']) {
        const result = yield* fetchWindows(
            '/sapi/v1/c2c/orderMatch/listUserOrderHistory',
            { tradeType, rows: 100, page: 1 },
            THIRTY_DAYS_MS,
            REWARD_LOOKBACK_WINDOWS,
            true
        );
        if (result.errorCode !== null) {
            yield* log(`Q7 p2p ${tradeType}: error ${result.errorCode}`);
        }
        orders.push(...result.rows);
    }
    const [firstOrder] = orders;
    if (firstOrder === undefined) {
        yield* log('Q7 p2p: unknown (no P2P orders found in the last 180d)');

        return;
    }
    const commissionKeys = ['commission', 'takerCommission'];
    const commissionAssetKey = Object.keys(firstOrder).find(key => /commission/i.test(key) && /(asset|currency)/i.test(key));
    yield* log(`Q7 p2p: order keys [${keyList(firstOrder)}]`);
    yield* log(
        `Q7 p2p: ${commissionKeys.map(key => `${key} present=${yesNo(orders.some(order => key in order))} non-zero=${yesNo(orders.some(order => numberOf(order[key]) > 0))}`).join('; ')}`
    );
    yield* log(
        `Q7 p2p: commission currency equals asset: ${commissionAssetKey === undefined ? 'unknown (no commission currency field)' : yesNo(orders.every(order => order[commissionAssetKey] === order['asset']))}`
    );
});

const probeAvailability = Effect.gen(function* () {
    const endTime = serverNow();
    const window = { startTime: endTime - THIRTY_DAYS_MS, endTime };
    const checks = [
        ...REWARD_ENDPOINTS.map(({ name, endpoint }) => ({ name, endpoint, params: { ...window, current: 1, size: 1 } })),
        { name: 'dividends', endpoint: '/sapi/v1/asset/assetDividend', params: { ...window, limit: 1 } },
        { name: 'dust', endpoint: '/sapi/v1/asset/dribblet', params: { ...window, accountType: 'SPOT' } },
        {
            name: 'universal-transfer',
            endpoint: '/sapi/v1/asset/transfer',
            params: { ...window, type: 'MAIN_FUNDING', current: 1, size: 1 }
        }
    ];
    for (const { name, endpoint, params } of checks) {
        const response = yield* call(endpoint, params);
        yield* log(`Q8 ${name}: ${response.status === 200 ? 'ok' : `error ${errorCodeOf(response)}`}`);
    }
});

const program = Effect.gen(function* () {
    if (apiKey === '' || apiSecret === '') {
        yield* log('Set BINANCE_API_KEY and BINANCE_API_SECRET (read-only key)');

        return;
    }
    yield* syncServerTime;
    yield* probeCapitalWindow;
    yield* probeTradeWindow;
    yield* probeWithdrawalFee;
    yield* probeRewardFields;
    yield* probeDust;
    yield* probeP2p;
    yield* probeAvailability;
    yield* probeFiatStatuses;
});

await Effect.runPromise(program);

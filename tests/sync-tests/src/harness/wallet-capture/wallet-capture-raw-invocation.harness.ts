import * as Schema from 'effect/Schema';

import type { AppIntentInvocation } from 'expo-app-intents';

const PARAM_DEFAULTS: Readonly<Record<string, string>> = {
    amount: '125',
    cardName: '"Mono Black"',
    currency: 'null',
    merchant: '"Silpo"'
};

const CREATED_AT = Date.parse('2026-08-07T10:00:00.000Z');

export const walletCaptureRawInvocation = (
    captureId: string,
    accountId: number,
    overrides: Readonly<Record<string, string>> = {}
): AppIntentInvocation => ({
    id: captureId,
    name: 'captureApplePayTransaction',
    params: Schema.decodeUnknownSync(Schema.Record(Schema.String, Schema.Unknown))(
        JSON.parse(
            `{${Object.entries({ ...PARAM_DEFAULTS, accountId: String(accountId), ...overrides })
                .map(([key, literal]) => `${JSON.stringify(key)}:${literal}`)
                .join(',')}}`
        )
    ),
    createdAt: CREATED_AT
});

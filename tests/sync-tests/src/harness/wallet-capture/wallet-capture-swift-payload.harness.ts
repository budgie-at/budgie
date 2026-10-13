import { isDefined } from '@rnw-community/shared';

const SWIFT_DEFAULTS: Readonly<Record<string, string>> = {
    amount: '125',
    capturedAt: '"2026-08-07T10:00:00.123Z"',
    cardName: '"Mono Black"',
    merchant: '"Silpo"',
    status: '"PENDING"'
};

export const walletCaptureSwiftJson = (
    captureId: string,
    accountId: number,
    overrides: Readonly<Record<string, string | null>> = {}
): string => {
    const fields: Record<string, string | null> = {
        ...SWIFT_DEFAULTS,
        accountId: String(accountId),
        captureId: JSON.stringify(captureId),
        ...overrides
    };

    return `{${Object.keys(fields)
        .sort()
        .flatMap(key => {
            const literal = fields[key];

            return isDefined(literal) ? [`${JSON.stringify(key)}:${literal}`] : [];
        })
        .join(',')}}`;
};

export const walletCaptureParseSwiftPayload = (recordJsons: readonly string[]): unknown[] => {
    const parsed: unknown = JSON.parse(`[${recordJsons.join(',')}]`);

    return Array.isArray(parsed) ? parsed : [];
};

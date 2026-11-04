import { createVerify, generateKeyPairSync } from 'node:crypto';

import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { EnableBankingSetupErrorReasonEnum } from '../src/sync/enum/enable-banking-setup-error-reason.enum';
import { parseEnableBankingApplicationId } from '../src/sync/utils/parse-enable-banking-application-id.util';
import { parseEnableBankingPem } from '../src/sync/utils/parse-enable-banking-pem.util';
import { resolveEnableBankingCallbackUrl } from '../src/sync/utils/resolve-enable-banking-callback-url.util';
import { signRs256 } from '../src/sync/utils/sign-rs256.util';

const APPLICATION_ID = '8b1d8f2e-2a7c-4f43-9d4e-3c8f6a1b9e55';
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pkcs8Pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const pkcs1Pem = privateKey.export({ type: 'pkcs1', format: 'pem' });
const encryptedPem = privateKey.export({ type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase: 'secret' });

it('reads the application id from a key file name', () => {
    expect(parseEnableBankingApplicationId(`${APPLICATION_ID}.pem`)).toBe(APPLICATION_ID);
    expect(parseEnableBankingApplicationId(`${APPLICATION_ID}.pem.txt`)).toBe(APPLICATION_ID);
    expect(parseEnableBankingApplicationId(`${APPLICATION_ID}.txt`)).toBeNull();
    expect(parseEnableBankingApplicationId(` ${APPLICATION_ID} `)).toBe(APPLICATION_ID);
    expect(parseEnableBankingApplicationId('private.key')).toBeNull();
    expect(parseEnableBankingApplicationId(`${APPLICATION_ID} (1).pem`)).toBeNull();
});

it.effect('accepts PKCS#8 and PKCS#1 keys and signs RS256 like node crypto', () =>
    Effect.gen(function* () {
        const signingInput = 'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJlbmFibGViYW5raW5nLmNvbSJ9';

        for (const pem of [pkcs8Pem, pkcs1Pem]) {
            const normalizedPem = yield* parseEnableBankingPem(pem);
            const signature = signRs256(normalizedPem, signingInput);

            expect(createVerify('RSA-SHA256').update(signingInput).verify(publicKey, Buffer.from(signature, 'base64url'))).toBe(true);
            expect(signature).toMatch(/^[\w-]+$/u);
        }
    })
);

it.effect('rejects encrypted and malformed keys with a clear reason', () =>
    Effect.gen(function* () {
        const encrypted = yield* Effect.flip(parseEnableBankingPem(encryptedPem));
        const malformed = yield* Effect.flip(parseEnableBankingPem('not a key'));

        expect(encrypted.reason).toBe(EnableBankingSetupErrorReasonEnum.ENCRYPTED);
        expect(malformed.reason).toBe(EnableBankingSetupErrorReasonEnum.INVALID_FORMAT);
    })
);

it('only treats the exact callback address as the Enable Banking callback', () => {
    expect(resolveEnableBankingCallbackUrl('budgie://enable-banking/callback?code=a&state=b')).toBe(
        'budgie://enable-banking/callback?code=a&state=b'
    );
    expect(resolveEnableBankingCallbackUrl('/enable-banking/callback?code=a&state=b')).toBe(
        'budgie://enable-banking/callback?code=a&state=b'
    );
    expect(resolveEnableBankingCallbackUrl('budgie://other?x=enable-banking/callback')).toBeNull();
    expect(resolveEnableBankingCallbackUrl('/account/1')).toBeNull();
});

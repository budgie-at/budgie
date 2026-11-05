import { createSign, createVerify, generateKeyPairSync } from 'node:crypto';

export const makeNodeRsaSigner = () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });

    return {
        sign: (signingInput: string): string => createSign('RSA-SHA256').update(signingInput).sign(privateKey).toString('base64url'),
        verify: (signingInput: string, signature: string): boolean =>
            createVerify('RSA-SHA256').update(signingInput).verify(publicKey, Buffer.from(signature, 'base64url'))
    };
};

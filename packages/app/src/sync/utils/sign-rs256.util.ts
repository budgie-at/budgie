import { md, pki, util } from 'node-forge';

export const signRs256 = (privateKeyPem: string, signingInput: string): string =>
    util
        .encode64(pki.privateKeyFromPem(privateKeyPem).sign(md.sha256.create().update(signingInput, 'utf8')))
        .replaceAll('+', '-')
        .replaceAll('/', '_')
        .replaceAll('=', '');

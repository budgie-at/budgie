import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';

import { walletCaptureNativeService } from './wallet-capture-native.service';

class WalletCaptureAccountMirrorService {
    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async refresh(): Promise<void> {
        const accounts = await accountRepository.getAllActiveAccounts();
        const activeAccounts = accounts.filter(account => account.isActive);
        const walletCaptureAccounts = activeAccounts.map(({ id, title }) => ({ id, title }));

        await walletCaptureNativeService.replaceAccounts(walletCaptureAccounts);
    }
}

export const walletCaptureAccountMirrorService = new WalletCaptureAccountMirrorService();

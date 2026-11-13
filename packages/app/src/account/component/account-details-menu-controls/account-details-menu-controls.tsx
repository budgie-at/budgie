import { useRef, useState } from 'react';

import { AnimatedBackdrop } from '../../../@generic/component/animated-backdrop/animated-backdrop';
import { isInzhurFundAccount } from '../../../inzhur/utils/is-inzhur-fund-account.util';
import { CreateTransactionMenu } from '../../../transaction/components/create-transaction-menu/create-transaction-menu';
import { isUntrackedOwnAccount } from '../../utils/is-untracked-own-account.util';
import { AccountFab } from '../account-fab/account-fab';

import type { AccountEntityInterface } from '@budgie/contracts';
import type { View } from 'react-native';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'type' | 'externalSource' | 'externalId'>;
}

export const AccountDetailsMenuControls = ({ account }: Props) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const triggerRef = useRef<View>(null);

    const handleOpenMenu = () => void setIsMenuOpen(true);
    const handleCloseMenu = () => void setIsMenuOpen(false);

    if (isInzhurFundAccount(account) || isUntrackedOwnAccount(account)) {
        return null;
    }

    return (
        <>
            <AccountFab ref={triggerRef} isMenuOpen={isMenuOpen} onPress={handleOpenMenu} />
            <AnimatedBackdrop isVisible={isMenuOpen} onClose={handleCloseMenu} />
            <CreateTransactionMenu
                isOpen={isMenuOpen}
                onClose={handleCloseMenu}
                triggerRef={triggerRef}
                accountId={account.id}
                accountType={account.type}
            />
        </>
    );
};

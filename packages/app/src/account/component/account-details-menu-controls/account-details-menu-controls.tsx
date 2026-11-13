import { useRef, useState } from 'react';
import { View } from 'react-native';

import { AnimatedBackdrop } from '../../../@generic/component/animated-backdrop/animated-backdrop';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { isInzhurFundAccount } from '../../../inzhur/utils/is-inzhur-fund-account.util';
import { CreateTransactionMenu } from '../../../transaction/components/create-transaction-menu/create-transaction-menu';
import { isUntrackedOwnAccount } from '../../utils/is-untracked-own-account.util';
import { AccountFab } from '../account-fab/account-fab';

import type { AccountEntityInterface } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'type' | 'externalSource' | 'externalId'>;
    readonly children: ReactNode;
}

export const AccountDetailsMenuControls = ({ account, children }: Props) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const triggerRef = useRef<View>(null);

    const handleOpenMenu = () => void setIsMenuOpen(true);
    const handleCloseMenu = () => void setIsMenuOpen(false);

    if (isInzhurFundAccount(account) || isUntrackedOwnAccount(account)) {
        return <GroupedSurface testID={AccountDetailsSelector.Page}>{children}</GroupedSurface>;
    }

    const contentAccessibility = isMenuOpen ? 'no-hide-descendants' : 'auto';

    return (
        <GroupedSurface testID={AccountDetailsSelector.Page}>
            <View className="flex-1" collapsable={false} importantForAccessibility={contentAccessibility}>
                {children}
            </View>
            <AccountFab ref={triggerRef} isMenuOpen={isMenuOpen} onPress={handleOpenMenu} />
            <AnimatedBackdrop isVisible={isMenuOpen} onClose={handleCloseMenu} />
            <CreateTransactionMenu
                isOpen={isMenuOpen}
                onClose={handleCloseMenu}
                triggerRef={triggerRef}
                accountId={account.id}
                accountType={account.type}
            />
        </GroupedSurface>
    );
};

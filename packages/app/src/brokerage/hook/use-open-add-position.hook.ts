import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useOpenModal } from '../../@generic/hook/use-open-modal/use-open-modal.hook';
import { useBankIntegration } from '../../sync/context/bank-integration.context';

export const useOpenAddPosition = () => {
    const { integration } = useBankIntegration();
    const openSecuritySelector = useOpenModal('/security-selector');

    return () =>
        void openSecuritySelector({ selectedSymbol: null }, listing => {
            if (isDefined(listing)) {
                router.push({ pathname: '/securities/buy/[id]', params: { id: String(integration.id), ...listing } });
            }
        });
};

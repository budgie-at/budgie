import { useAtomMount } from '@effect/atom-react/Hooks';

import { enableBankingPublicBanksAtom } from '../../constant/enable-banking-public-banks-atom.constant';

export const EnableBankingPublicBanksWarmup = () => {
    useAtomMount(enableBankingPublicBanksAtom);

    return null;
};

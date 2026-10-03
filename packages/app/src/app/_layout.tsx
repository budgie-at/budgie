import { RegistryContext } from '@effect/atom-react/RegistryContext';

import { appAtomRegistry } from '../@generic/constant/app-atom-registry.constant';

import { RootLayoutContent } from './root-layout-content';

const unstableSettings = {
    anchor: '(tabs)'
};

export { unstableSettings as 'unstable_settings' };

export default function RootLayout() {
    return (
        <RegistryContext.Provider value={appAtomRegistry}>
            <RootLayoutContent />
        </RegistryContext.Provider>
    );
}

import { useBootstrapReset } from '../@generic/hook/use-bootstrap-reset.hook';

import { RootLayoutContent } from './root-layout-content';

export default function RootLayout() {
    const isBootstrapReady = useBootstrapReset();

    if (!isBootstrapReady) {
        return null;
    }

    return <RootLayoutContent />;
}

import { usePragmaOptimize } from '../@generic/drizzle/hook/use-pragma-optimize.hook';

import { RootLayoutContent } from './root-layout-content';

export default function RootLayout() {
    usePragmaOptimize();

    return <RootLayoutContent />;
}

import { RootLayoutContent } from './root-layout-content';

const unstableSettings = {
    anchor: '(tabs)'
};

export { unstableSettings as 'unstable_settings' };

export default function RootLayout() {
    return <RootLayoutContent />;
}

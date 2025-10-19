import { SafeAreaView } from 'react-native-safe-area-context';

import type { ComponentProps } from 'react';

const style = { flex: 1 };

export const Page = (props: ComponentProps<typeof SafeAreaView>) => <SafeAreaView style={style} {...props} />;

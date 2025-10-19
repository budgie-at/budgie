import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ComponentProps } from 'react';

const Wrapper = styled(SafeAreaView);

export const Page = (props: ComponentProps<typeof SafeAreaView>) => <Wrapper {...props} className="bg-bg-primary flex-1" />;

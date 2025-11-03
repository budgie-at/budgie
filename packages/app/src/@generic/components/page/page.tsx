import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ComponentProps } from 'react';

const Wrapper = styled(SafeAreaView);

export const Page = (props: ComponentProps<typeof SafeAreaView>) => <Wrapper {...props} className="bg-primary-reverse flex-1 pl-5xl pr-5xl" />;

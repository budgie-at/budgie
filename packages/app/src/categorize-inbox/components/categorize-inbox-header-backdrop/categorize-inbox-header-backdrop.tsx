import { CollapsibleHeaderBackdrop } from '@rnw-community/react-native-screen-chrome';

const SCROLL_ANIMATION = { opacityInputRange: [0, 8] } as const;

export const CategorizeInboxHeaderBackdrop = () => <CollapsibleHeaderBackdrop scrollAnimation={SCROLL_ANIMATION} />;

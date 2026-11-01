import { Text } from 'react-native';

import { splitHighlight } from '../../utils/split-highlight.util';

interface Props {
    readonly text: string;
    readonly highlight: string;
}

export const SelectorRowSubtitle = ({ text, highlight }: Props) => {
    const [beforeMatch, match, afterMatch] = splitHighlight(text, highlight);

    return (
        <Text className="text-secondary-foreground text-[13px] leading-[18px]" numberOfLines={1}>
            {beforeMatch}
            <Text className="text-primary font-semibold">{match}</Text>
            {afterMatch}
        </Text>
    );
};

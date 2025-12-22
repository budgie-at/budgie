import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly value: string | undefined;
    readonly headers: string[];
    readonly onSelect: (header: string) => void;
    readonly hasError?: boolean;
}

const sortHeaders = (first: string, second: string): number => first.localeCompare(second);

export const ImportColumnMapper = ({ value, headers, onSelect, hasError = false }: Props) => {
    const { t } = useLingui();
    const [isExpanded, setIsExpanded] = useState(false);

    const hasValue = isNotEmptyString(value);

    const handleToggle = () => void setIsExpanded(prev => !prev);
    const handleSelect = (header: string) => () => {
        onSelect(header);
        setIsExpanded(false);
    };

    const sortedHeaders = useMemo(() => [...headers].sort(sortHeaders), [headers]);
    const chevronIcon = isExpanded ? ICONS.ChevronDown : ICONS.ChevronRight;
    const cardClassName = cn('p-3xl gap-y-md', hasError && 'border-destructive-corner'); // eslint-disable-line lingui/no-unlocalized-strings

    return (
        <Card className={cardClassName}>
            <Pressable onPress={handleToggle} className="flex-row items-center justify-between">
                <Text className={cn('text-primary text-md flex-1', !hasValue && 'text-secondary-foreground')}>
                    {hasValue ? value : t`Select column...`}
                </Text>
                <Icon icon={chevronIcon} size={20} className="text-secondary-foreground" />
            </Pressable>

            {isExpanded && (
                <View className="border-t border-secondary-corner pt-md gap-y-xs">
                    {sortedHeaders.map(header => (
                        <Pressable
                            key={header}
                            onPress={handleSelect(header)}
                            className={cn(
                                'p-md rounded-xl flex-row items-center justify-between',
                                header === value && 'bg-secondary-background'
                            )}
                        >
                            <Text className={cn('text-primary text-sm', header === value && 'font-semibold')}>{header}</Text>
                            {header === value && <Icon icon={ICONS.Check} size={16} className="text-positive-foreground" />}
                        </Pressable>
                    ))}
                </View>
            )}
        </Card>
    );
};

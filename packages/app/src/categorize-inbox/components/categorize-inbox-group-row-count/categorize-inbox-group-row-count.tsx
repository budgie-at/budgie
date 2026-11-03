import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'rows'>;
}

export const CategorizeInboxGroupRowCount = ({ cluster }: Props) => {
    const { t } = useLingui();

    return (
        <Text className="shrink-0 text-[13px] leading-[17px] text-secondary-foreground tabular-nums" numberOfLines={1}>
            {t({ message: plural(cluster.rows.length, { one: '# payment', other: '# payments' }) })}
        </Text>
    );
};

import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly section: CategorizeInboxSectionEnum;
    readonly className?: string;
}

export const CategorizeInboxSectionTitle = ({ section, className }: Props) => {
    const { t } = useLingui();

    const sectionTitles: Record<CategorizeInboxSectionEnum, string> = {
        [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: t`Cash withdrawals`,
        [CategorizeInboxSectionEnum.CONFIDENT]: t`Ready to accept`,
        [CategorizeInboxSectionEnum.REVIEW]: t`Needs review`,
        [CategorizeInboxSectionEnum.ONE_OFFS]: t`One-offs`
    };

    return (
        <Text className={cn('shrink', className)} numberOfLines={1}>
            {sectionTitles[section]}
        </Text>
    );
};

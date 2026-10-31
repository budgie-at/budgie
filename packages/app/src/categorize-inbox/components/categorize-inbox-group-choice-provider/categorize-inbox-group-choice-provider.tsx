import { useState } from 'react';

import { CategorizeInboxGroupChoiceContext } from '../../context/categorize-inbox-group-choice.context';
import { useCategorizeInboxGroupOptions } from '../../hook/use-categorize-inbox-group-options.hook';

import type { CategorizeInboxGroupChoiceType } from '../../interface/categorize-inbox-group-choice.type';
import type { CategorizeInboxClusterInterface } from '@budgie/categorization';
import type { ReactNode } from 'react';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly children: ReactNode;
}

export const CategorizeInboxGroupChoiceProvider = ({ cluster, children }: Props) => {
    const [selectedChoice, setSelectedChoice] = useState<CategorizeInboxGroupChoiceType | null>(null);

    const { leadChoice } = useCategorizeInboxGroupOptions(cluster);

    const value = { choice: selectedChoice ?? leadChoice, select: setSelectedChoice };

    return <CategorizeInboxGroupChoiceContext value={value}>{children}</CategorizeInboxGroupChoiceContext>;
};

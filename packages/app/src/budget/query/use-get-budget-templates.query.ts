import { BudgetTemplateEntityInterface } from '@budgie/contracts';
import { useEffect, useState } from 'react';

import { budgetTemplateRepository } from '../../@generic/drizzle/db/db';

export const useGetBudgetTemplatesQuery = () => {
    const [templates, setTemplates] = useState<BudgetTemplateEntityInterface[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const refetch = () => {
        setIsLoading(true);
        void budgetTemplateRepository
            .findAll()
            .then(setTemplates)
            .catch(() => void setTemplates([]))
            .finally(() => void setIsLoading(false));
    };

    useEffect(() => {
        refetch();
    }, []);

    return { templates, isLoading, refetch };
};

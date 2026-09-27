import { createContext } from 'react';

import type { CategoryEntityInterface } from '@budgie/contracts';

export const CategorySelectorCategoriesContext = createContext<CategoryEntityInterface[] | null>(null);

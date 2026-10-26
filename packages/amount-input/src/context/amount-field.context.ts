import { createContext } from 'react';

import type { AmountFieldContextValueInterface } from '../interface/amount-field-context-value.interface';

export const AmountFieldContext = createContext<AmountFieldContextValueInterface | null>(null);

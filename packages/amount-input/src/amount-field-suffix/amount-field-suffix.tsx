import { AmountFieldSymbol } from '../component/amount-field-symbol';

import type { AmountFieldSymbolPropsInterface } from '../interface/amount-field-symbol-props.interface';

export const AmountFieldSuffix = (props: AmountFieldSymbolPropsInterface) => <AmountFieldSymbol {...props} gapSide="marginStart" />;

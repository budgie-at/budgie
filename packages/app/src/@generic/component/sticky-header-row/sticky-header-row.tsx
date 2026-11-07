import type { LegendListProps } from '@legendapp/list/react-native';

type RenderItem<TItem> = NonNullable<LegendListProps<TItem>['renderItem']>;

type Props<TItem> = Parameters<RenderItem<TItem>>[0] & { readonly renderItem: RenderItem<TItem> };

export const StickyHeaderRow = <TItem,>({ renderItem, ...info }: Props<TItem>) => renderItem(info);

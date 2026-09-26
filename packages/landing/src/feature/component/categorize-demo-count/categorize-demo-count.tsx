interface Props {
    readonly total: number;
}

export const CategorizeDemoCount = ({ total }: Props) => (
    <span data-cdemo-count data-total={total}>
        {total}
    </span>
);

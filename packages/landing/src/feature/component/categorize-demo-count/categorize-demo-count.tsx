interface Props {
    readonly from: number;
    readonly to: number;
}

export const CategorizeDemoCount = ({ from, to }: Props) => (
    <span data-cdemo-count data-from={from} data-to={to}>
        {from}
    </span>
);

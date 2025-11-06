interface Props {
    name: string;
}

export const BanksSectionItem = ({ name }: Props) => (
    <div className="h-8 px-4 flex items-center justify-center bg-muted rounded text-sm font-medium text-muted-foreground">{name}</div>
);

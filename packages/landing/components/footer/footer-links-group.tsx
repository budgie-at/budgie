import Link from 'next/link';

export interface FooterLinksGroupProps {
    readonly title: string;
    readonly links: { title: string; href: string }[];
}

export const FooterLinksGroup = ({ title, links }: FooterLinksGroupProps) => (
    <div className="space-y-4">
        <h4 className="text-sm font-bold">{title}</h4>

        <ul className="space-y-2 text-sm">
            {links.map(link => (
                <li key={link.href}>
                    <Link className="text-muted-foreground hover:text-foreground transition-colors" href={link.href}>
                        {link.title}
                    </Link>
                </li>
            ))}
        </ul>
    </div>
);

import { type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export const BlogFaqSection = ({ children }: Props) => <div className="space-y-6">{children}</div>;

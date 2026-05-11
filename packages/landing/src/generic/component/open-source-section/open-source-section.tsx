import { OpenSourceContent } from './open-source-content';
import { OpenSourceVisual } from './open-source-visual';

interface Props {
    readonly locale: string;
}

export const OpenSourceSection = ({ locale }: Props) => (
    <section className="w-full py-20 md:py-28 bg-linear-to-b from-background to-muted/30" id="open-source">
        <div className="container px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                <OpenSourceContent locale={locale} />
                <OpenSourceVisual />
            </div>
        </div>
    </section>
);

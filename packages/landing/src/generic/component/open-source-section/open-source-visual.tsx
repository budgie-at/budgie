import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';
import { Motion } from '../motion/motion';

import { OpenSourceVisualCode } from './open-source-visual-code';
import { OpenSourceVisualHeader } from './open-source-visual-header';
import { OpenSourceVisualStats } from './open-source-visual-stats';
import { OpenSourceVisualTitleBar } from './open-source-visual-title-bar';

const visualInitial = { opacity: 0, x: 20 };
const visualAnimate = { opacity: 1, x: 0 };
const visualTransition = { duration: 0.5, delay: 0.2 };
const viewportOnce = { once: true };

export const OpenSourceVisual = () => (
    <Motion initial={visualInitial} transition={visualTransition} viewport={viewportOnce} whileInView={visualAnimate}>
        <Card className="border-border/40 bg-linear-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
            <CardContent className="p-0">
                <OpenSourceVisualTitleBar />

                <div className="p-6 space-y-6">
                    <OpenSourceVisualHeader />
                    <OpenSourceVisualStats />
                    <OpenSourceVisualCode />
                </div>
            </CardContent>
        </Card>
    </Motion>
);

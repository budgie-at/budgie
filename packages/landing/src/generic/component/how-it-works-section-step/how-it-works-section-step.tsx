import { Motion } from '../motion/motion';

interface Props {
    step: string;
    title: string;
    description: string;
    index: number;
}

const initialMotion = { opacity: 0, y: 20 };
const animatedMotion = { opacity: 1, y: 0 };
const viewport = { once: true };

export const HowItWorksSectionStep = ({ step, title, description, index }: Props) => {
    const stepTransition = { duration: 0.5, delay: index * 0.1 };

    return (
        <Motion
            className="relative z-10 flex flex-col items-center text-center space-y-4"
            initial={initialMotion}
            transition={stepTransition}
            viewport={viewport}
            whileInView={animatedMotion}
        >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/70 text-primary-foreground text-xl font-bold shadow-lg">
                {step}
            </div>

            <h3 className="text-xl font-bold">{title}</h3>

            <p className="text-muted-foreground">{description}</p>
        </Motion>
    );
};

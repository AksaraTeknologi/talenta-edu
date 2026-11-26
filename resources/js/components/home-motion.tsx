import { animate, motion, useInView, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';

export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
export const VIEWPORT_ONCE = { once: true, amount: 0.15 } as const;

export function ScrollProgressBar() {
    const prefersReducedMotion = useReducedMotion();
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 180,
        damping: 30,
        restDelta: 0.001,
    });

    if (prefersReducedMotion) {
        return null;
    }

    return (
        <motion.div
            aria-hidden="true"
            style={{ scaleX }}
            className="pointer-events-none fixed top-0 right-0 left-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[#1976D3] via-[#1976D3] to-[#D95B16]"
        />
    );
}

interface RevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    y?: number;
    x?: number;
    scale?: number;
    immediate?: boolean;
}

export function Reveal({
    children,
    className,
    delay = 0,
    duration = 0.6,
    y = 24,
    x = 0,
    scale = 1,
    immediate = false,
}: RevealProps) {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>;
    }

    if (immediate) {
        return (
            <motion.div
                className={className}
                initial={{ opacity: 0, y, x, scale }}
                animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                transition={{ duration, delay, ease: EASE_OUT_EXPO }}
            >
                {children}
            </motion.div>
        );
    }

    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y, x, scale }}
            whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            viewport={VIEWPORT_ONCE}
            transition={{ duration, delay, ease: EASE_OUT_EXPO }}
        >
            {children}
        </motion.div>
    );
}

interface CountUpNumberProps {
    target: number;
    suffix?: string;
    locale: string;
    duration?: number;
}

export function CountUpNumber({ target, suffix = '', locale, duration = 1.35 }: CountUpNumberProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });
    const prefersReducedMotion = useReducedMotion();
    const [displayValue, setDisplayValue] = useState(() => (prefersReducedMotion ? target : 0));

    useEffect(() => {
        if (prefersReducedMotion) {
            setDisplayValue(target);
            return;
        }

        if (!isInView) {
            return;
        }

        const controls = animate(0, target, {
            duration,
            ease: EASE_OUT_EXPO,
            onUpdate: (latest) => setDisplayValue(Math.round(latest)),
        });

        return () => controls.stop();
    }, [isInView, target, duration, prefersReducedMotion]);

    return (
        <span ref={ref}>
            {displayValue.toLocaleString(locale)}
            {suffix}
        </span>
    );
}

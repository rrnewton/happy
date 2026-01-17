import * as React from 'react';

/**
 * Hook that creates a typewriter effect for text.
 * Characters are revealed one at a time with a configurable speed.
 *
 * @param text - The full text to display
 * @param speed - Milliseconds between each character (default: 30ms)
 * @param startDelay - Delay before starting the typewriter effect (default: 0ms)
 * @param enabled - Whether the effect should run (default: true)
 * @returns Object with displayText and isComplete status
 */
export function useTypewriter(
    text: string,
    speed: number = 30,
    startDelay: number = 0,
    enabled: boolean = true
): { displayText: string; isComplete: boolean } {
    const [displayText, setDisplayText] = React.useState(enabled ? '' : text);
    const [isComplete, setIsComplete] = React.useState(!enabled);
    const indexRef = React.useRef(0);

    React.useEffect(() => {
        if (!enabled) {
            setDisplayText(text);
            setIsComplete(true);
            return;
        }

        // Reset when text changes
        indexRef.current = 0;
        setDisplayText('');
        setIsComplete(false);

        let timeoutId: ReturnType<typeof setTimeout>;

        const startTyping = () => {
            const typeNext = () => {
                if (indexRef.current < text.length) {
                    indexRef.current++;
                    setDisplayText(text.slice(0, indexRef.current));
                    timeoutId = setTimeout(typeNext, speed);
                } else {
                    setIsComplete(true);
                }
            };
            typeNext();
        };

        if (startDelay > 0) {
            timeoutId = setTimeout(startTyping, startDelay);
        } else {
            startTyping();
        }

        return () => {
            clearTimeout(timeoutId);
        };
    }, [text, speed, startDelay, enabled]);

    return { displayText, isComplete };
}

/**
 * Hook that creates a typewriter effect for multiple lines.
 * Each line appears with typewriter effect after the previous line completes.
 *
 * @param lines - Array of text lines to display
 * @param charSpeed - Milliseconds between each character (default: 30ms)
 * @param lineDelay - Delay between lines (default: 200ms)
 * @param enabled - Whether the effect should run (default: true)
 * @returns Object with displayLines array and isComplete status
 */
export function useTypewriterLines(
    lines: string[],
    charSpeed: number = 30,
    lineDelay: number = 200,
    enabled: boolean = true
): { displayLines: string[]; isComplete: boolean; currentLineIndex: number } {
    const [currentLineIndex, setCurrentLineIndex] = React.useState(0);
    const [displayLines, setDisplayLines] = React.useState<string[]>(enabled ? [] : lines);
    const [currentLineText, setCurrentLineText] = React.useState('');
    const [isComplete, setIsComplete] = React.useState(!enabled);

    React.useEffect(() => {
        if (!enabled) {
            setDisplayLines(lines);
            setIsComplete(true);
            setCurrentLineIndex(lines.length);
            return;
        }

        // Reset
        setCurrentLineIndex(0);
        setDisplayLines([]);
        setCurrentLineText('');
        setIsComplete(false);
    }, [lines, enabled]);

    // Type current line
    React.useEffect(() => {
        if (!enabled || currentLineIndex >= lines.length) {
            return;
        }

        const currentLine = lines[currentLineIndex];
        let charIndex = 0;
        setCurrentLineText('');

        const typeInterval = setInterval(() => {
            if (charIndex < currentLine.length) {
                charIndex++;
                setCurrentLineText(currentLine.slice(0, charIndex));
            } else {
                clearInterval(typeInterval);
                // Line complete - add to display lines after a delay
                setTimeout(() => {
                    setDisplayLines(prev => [...prev, currentLine]);
                    setCurrentLineText('');
                    if (currentLineIndex + 1 >= lines.length) {
                        setIsComplete(true);
                    } else {
                        setCurrentLineIndex(prev => prev + 1);
                    }
                }, lineDelay);
            }
        }, charSpeed);

        return () => clearInterval(typeInterval);
    }, [currentLineIndex, lines, charSpeed, lineDelay, enabled]);

    // Combine completed lines with current typing line
    const allDisplayLines = React.useMemo(() => {
        if (currentLineText) {
            return [...displayLines, currentLineText];
        }
        return displayLines;
    }, [displayLines, currentLineText]);

    return { displayLines: allDisplayLines, isComplete, currentLineIndex };
}

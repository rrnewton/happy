import * as React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSequence,
    withRepeat,
    runOnJS,
    Easing,
    FadeIn,
} from 'react-native-reanimated';
import { Typography } from '@/constants/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BootSequenceProps {
    onComplete: () => void;
}

// Boot messages with progress percentages for web version
const BOOT_LINES = [
    { text: 'HAPPY BIOS v2.4.1', type: 'header', progress: null },
    { text: 'Copyright (c) 2024-2025 Happy Engineering', type: 'header', progress: null },
    { text: '', type: 'empty', progress: null },
    { text: 'CPU: Neural Processing Unit @ 3.2 THz', type: 'info', progress: null },
    { text: 'Memory: 128 PB Quantum RAM', type: 'info', progress: 100 },
    { text: 'Storage: 1 EB Holographic Array', type: 'info', progress: 100 },
    { text: '', type: 'empty', progress: null },
    { text: 'Initializing kernel...', type: 'dim', progress: null },
    { text: 'Loading drivers...', type: 'dim', progress: null },
    { text: '[  OK  ] Started Cryptographic Services', type: 'success', progress: null },
    { text: '[  OK  ] Started Neural Network Interface', type: 'success', progress: null },
    { text: '[  OK  ] Started Quantum Encryption Module', type: 'success', progress: null },
    { text: '[  OK  ] Started Secure Socket Layer', type: 'success', progress: null },
    { text: '[  OK  ] Started Authentication Daemon', type: 'success', progress: null },
    { text: '[  OK  ] Started Happy Core Services', type: 'success', progress: null },
    { text: '', type: 'empty', progress: null },
    { text: 'BIOMETRIC SCAN... VERIFIED', type: 'scan', progress: null },
    { text: 'SECURE TUNNEL ESTABLISHED', type: 'network', progress: null },
    { text: '', type: 'empty', progress: null },
    { text: 'System ready.', type: 'info', progress: null },
];

// Web-only enhanced boot lines with more sci-fi content
const BOOT_LINES_WEB = [
    { text: 'HAPPY BIOS v2.4.1', type: 'header', progress: null },
    { text: 'Copyright (c) 2024-2025 Happy Engineering', type: 'header', progress: null },
    { text: '', type: 'empty', progress: null },
    { text: 'POST: Power-On Self Test', type: 'dim', progress: null },
    { text: 'CPU: Neural Processing Unit @ 3.2 THz', type: 'info', progress: null },
    { text: 'Memory Test: 128 PB Quantum RAM', type: 'info', progress: 100 },
    { text: 'Storage: 1 EB Holographic Array', type: 'info', progress: 100 },
    { text: 'GPU: Photonic Rendering Engine x4', type: 'info', progress: null },
    { text: '', type: 'empty', progress: null },
    { text: '0x7FFF5FBFF8A0 Kernel space allocated', type: 'hex', progress: null },
    { text: '0x00007F8B2C000000 User space mapped', type: 'hex', progress: null },
    { text: '', type: 'empty', progress: null },
    { text: 'Initializing quantum kernel...', type: 'dim', progress: null },
    { text: 'Loading neural drivers...', type: 'dim', progress: null },
    { text: '[  OK  ] Started Cryptographic Services', type: 'success', progress: null },
    { text: '[  OK  ] Started Neural Network Interface', type: 'success', progress: null },
    { text: '[  OK  ] Started Quantum Encryption Module', type: 'success', progress: null },
    { text: '[  OK  ] Started Holographic Display Driver', type: 'success', progress: null },
    { text: '[  OK  ] Started Secure Socket Layer', type: 'success', progress: null },
    { text: '[  OK  ] Started Authentication Daemon', type: 'success', progress: null },
    { text: '[  OK  ] Started Happy Core Services', type: 'success', progress: null },
    { text: '', type: 'empty', progress: null },
    { text: 'BIOMETRIC SCAN... VERIFIED', type: 'scan', progress: null },
    { text: 'NEURAL LINK... ESTABLISHED', type: 'scan', progress: null },
    { text: 'IP: 10.42.0.1 via quantum-tunnel-0', type: 'network', progress: null },
    { text: 'SECURE TUNNEL TO HAPPY.ENGINEERING... OK', type: 'network', progress: null },
    { text: '', type: 'empty', progress: null },
    { text: 'All systems nominal. Welcome back.', type: 'info', progress: null },
];

// Random glitch characters for web effect
const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`░▒▓█▀▄';

// Matrix-style characters for background rain
const MATRIX_CHARS = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';

/**
 * Iron Man-style boot sequence animation.
 * Web version includes enhanced effects: scan lines, glitches, matrix rain, typing effect.
 */
export const BootSequence = React.memo(function BootSequence({ onComplete }: BootSequenceProps) {
    const insets = useSafeAreaInsets();
    const isWeb = Platform.OS === 'web';
    const bootLines = isWeb ? BOOT_LINES_WEB : BOOT_LINES;

    const [visibleLineCount, setVisibleLineCount] = React.useState(0);
    const [phase, setPhase] = React.useState<'boot' | 'complete'>('boot');
    const [showCursor, setShowCursor] = React.useState(true);

    // Web-only states
    const [typingLineIndex, setTypingLineIndex] = React.useState(-1);
    const [typingCharIndex, setTypingCharIndex] = React.useState(0);
    const [glitchLine, setGlitchLine] = React.useState<number | null>(null);
    const [glitchText, setGlitchText] = React.useState('');
    const [scanLinePosition, setScanLinePosition] = React.useState(0);
    const [matrixColumns, setMatrixColumns] = React.useState<{ chars: string[], x: number, speed: number }[]>([]);
    const [showFlicker, setShowFlicker] = React.useState(false);
    const [lineProgress, setLineProgress] = React.useState<Record<number, number>>({});

    // Animation values
    const biosOpacity = useSharedValue(0);
    const accessGrantedOpacity = useSharedValue(0);
    const accessGrantedScale = useSharedValue(0.8);
    const containerOpacity = useSharedValue(1);
    const cursorOpacity = useSharedValue(1);
    const progressWidth = useSharedValue(0);
    const irisScale = useSharedValue(1);

    // Blinking cursor effect
    React.useEffect(() => {
        cursorOpacity.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 400 }),
                withTiming(1, { duration: 400 })
            ),
            -1,
            false
        );
    }, []);

    // Web-only: Scan line animation
    React.useEffect(() => {
        if (!isWeb) return;
        const interval = setInterval(() => {
            setScanLinePosition(prev => (prev + 2) % 100);
        }, 30);
        return () => clearInterval(interval);
    }, [isWeb]);

    // Web-only: Matrix rain effect
    React.useEffect(() => {
        if (!isWeb) return;

        // Initialize matrix columns
        const cols: { chars: string[], x: number, speed: number }[] = [];
        const numColumns = 15;
        for (let i = 0; i < numColumns; i++) {
            const chars: string[] = [];
            const length = Math.floor(Math.random() * 10) + 5;
            for (let j = 0; j < length; j++) {
                chars.push(MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]);
            }
            cols.push({
                chars,
                x: Math.random() * 100,
                speed: Math.random() * 0.5 + 0.3,
            });
        }
        setMatrixColumns(cols);

        // Animate matrix
        const interval = setInterval(() => {
            setMatrixColumns(prev => prev.map(col => ({
                ...col,
                chars: col.chars.map(() =>
                    Math.random() > 0.9
                        ? MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
                        : col.chars[Math.floor(Math.random() * col.chars.length)]
                ),
            })));
        }, 100);

        return () => clearInterval(interval);
    }, [isWeb]);

    // Web-only: Random glitch effect
    React.useEffect(() => {
        if (!isWeb || phase === 'complete') return;

        const glitchInterval = setInterval(() => {
            if (Math.random() > 0.85 && visibleLineCount > 0) {
                const randomLine = Math.floor(Math.random() * visibleLineCount);
                const originalText = bootLines[randomLine]?.text || '';
                if (originalText.length > 0) {
                    setGlitchLine(randomLine);
                    // Create glitched version
                    let glitched = '';
                    for (let i = 0; i < originalText.length; i++) {
                        glitched += Math.random() > 0.7
                            ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
                            : originalText[i];
                    }
                    setGlitchText(glitched);

                    // Clear glitch after brief moment
                    setTimeout(() => {
                        setGlitchLine(null);
                        setGlitchText('');
                    }, 50);
                }
            }
        }, 200);

        return () => clearInterval(glitchInterval);
    }, [isWeb, visibleLineCount, phase, bootLines]);

    // Start the boot sequence - show lines one by one
    React.useEffect(() => {
        // Show BIOS header immediately
        biosOpacity.value = withTiming(1, { duration: 300 });

        // Start progress bar
        const totalDuration = bootLines.length * (isWeb ? 100 : 120) + 800;
        progressWidth.value = withTiming(100, {
            duration: totalDuration,
            easing: Easing.linear,
        });

        // Show lines one by one with staggered delays
        let currentLine = 0;

        const showNextLine = () => {
            if (currentLine < bootLines.length) {
                const line = bootLines[currentLine];

                if (isWeb && line.text.length > 0 && line.type !== 'empty') {
                    // Web: typing effect
                    setTypingLineIndex(currentLine);
                    setTypingCharIndex(0);

                    // Animate progress bar for lines with progress
                    if (line.progress !== null) {
                        let prog = 0;
                        const progInterval = setInterval(() => {
                            prog += 10;
                            setLineProgress(prev => ({ ...prev, [currentLine]: Math.min(prog, 100) }));
                            if (prog >= 100) {
                                clearInterval(progInterval);
                            }
                        }, 30);
                    }

                    // Type out each character
                    let charIdx = 0;
                    const typeInterval = setInterval(() => {
                        charIdx++;
                        setTypingCharIndex(charIdx);
                        if (charIdx >= line.text.length) {
                            clearInterval(typeInterval);
                            setVisibleLineCount(currentLine + 1);
                            setTypingLineIndex(-1);
                            currentLine++;

                            // Variable delay based on line type
                            let delay = 80;
                            if (line.type === 'header') delay = 120;
                            else if (line.type === 'success') delay = 60;
                            else if (line.type === 'dim') delay = 150;
                            else if (line.type === 'scan') delay = 200;

                            setTimeout(showNextLine, delay);
                        }
                    }, 15); // Fast typing speed
                } else {
                    // Native or empty line: instant show
                    setVisibleLineCount(currentLine + 1);
                    currentLine++;

                    let delay = 100;
                    if (line.type === 'empty') delay = 50;
                    else if (line.type === 'header') delay = 150;
                    else if (line.type === 'success') delay = 80;
                    else if (line.type === 'dim') delay = 200;

                    setTimeout(showNextLine, delay);
                }
            } else {
                // All lines shown - trigger completion
                setTimeout(() => {
                    setPhase('complete');
                    setShowCursor(false);
                }, 300);
            }
        };

        // Start showing lines after a brief delay
        const startTimer = setTimeout(showNextLine, 400);

        return () => {
            clearTimeout(startTimer);
        };
    }, [bootLines, isWeb]);

    // When boot is complete, show ACCESS GRANTED and fade out
    React.useEffect(() => {
        if (phase === 'complete') {
            // Web: flicker effect before ACCESS GRANTED
            if (isWeb) {
                setShowFlicker(true);
                setTimeout(() => setShowFlicker(false), 100);
                setTimeout(() => {
                    setShowFlicker(true);
                    setTimeout(() => setShowFlicker(false), 50);
                }, 150);
            }

            // Show ACCESS GRANTED with scale animation
            accessGrantedOpacity.value = withDelay(isWeb ? 300 : 200, withTiming(1, { duration: 400 }));
            accessGrantedScale.value = withDelay(isWeb ? 300 : 200, withSequence(
                withTiming(1.15, { duration: 200, easing: Easing.out(Easing.back(2)) }),
                withTiming(1, { duration: 150 })
            ));

            // Fade out (web uses iris effect)
            const fadeOut = setTimeout(() => {
                if (isWeb) {
                    // Iris/aperture close effect
                    irisScale.value = withTiming(0, { duration: 600, easing: Easing.in(Easing.cubic) }, (finished) => {
                        if (finished) {
                            runOnJS(onComplete)();
                        }
                    });
                } else {
                    containerOpacity.value = withTiming(0, { duration: 500 }, (finished) => {
                        if (finished) {
                            runOnJS(onComplete)();
                        }
                    });
                }
            }, 1200);

            return () => clearTimeout(fadeOut);
        }
    }, [phase, isWeb]);

    // Allow tap to skip
    const handleSkip = React.useCallback(() => {
        if (isWeb) {
            irisScale.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) }, (finished) => {
                if (finished) {
                    runOnJS(onComplete)();
                }
            });
        } else {
            containerOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
                if (finished) {
                    runOnJS(onComplete)();
                }
            });
        }
    }, [onComplete, isWeb]);

    // Animated styles
    const biosStyle = useAnimatedStyle(() => ({
        opacity: biosOpacity.value,
    }));

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    const cursorStyle = useAnimatedStyle(() => ({
        opacity: cursorOpacity.value,
    }));

    const accessGrantedStyle = useAnimatedStyle(() => ({
        opacity: accessGrantedOpacity.value,
        transform: [{ scale: accessGrantedScale.value }],
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    const irisStyle = useAnimatedStyle(() => ({
        transform: [{ scale: irisScale.value }],
    }));

    // Get line style based on type
    const getLineStyle = (type: string) => {
        switch (type) {
            case 'header':
                return styles.bootLineHeader;
            case 'success':
                return styles.bootLineSuccess;
            case 'error':
                return styles.bootLineError;
            case 'dim':
                return styles.bootLineDim;
            case 'hex':
                return styles.bootLineHex;
            case 'scan':
                return styles.bootLineScan;
            case 'network':
                return styles.bootLineNetwork;
            case 'empty':
                return styles.bootLine;
            default:
                return styles.bootLine;
        }
    };

    // Get visible lines
    const visibleLines = bootLines.slice(0, visibleLineCount);

    // Render inline progress bar
    const renderProgressBar = (lineIndex: number, progress: number | null) => {
        if (!isWeb || progress === null) return null;
        const currentProgress = lineProgress[lineIndex] ?? 0;
        return (
            <Text style={styles.inlineProgress}>
                {' ['}
                <Text style={styles.progressFilled}>{'█'.repeat(Math.floor(currentProgress / 10))}</Text>
                <Text style={styles.progressEmpty}>{'░'.repeat(10 - Math.floor(currentProgress / 10))}</Text>
                {`] ${currentProgress}%`}
            </Text>
        );
    };

    return (
        <Pressable onPress={handleSkip} style={{ flex: 1 }}>
            <Animated.View style={[styles.container, isWeb ? {} : containerStyle, { paddingTop: insets.top + 20 }]}>
                {/* Web-only: Matrix rain background */}
                {isWeb && (
                    <View style={styles.matrixContainer} pointerEvents="none">
                        {matrixColumns.map((col, idx) => (
                            <View
                                key={idx}
                                style={[styles.matrixColumn, { left: `${col.x}%` }]}
                            >
                                {col.chars.map((char, charIdx) => (
                                    <Text
                                        key={charIdx}
                                        style={[
                                            styles.matrixChar,
                                            { opacity: 0.1 + (charIdx / col.chars.length) * 0.15 }
                                        ]}
                                    >
                                        {char}
                                    </Text>
                                ))}
                            </View>
                        ))}
                    </View>
                )}

                {/* Web-only: Scan line effect */}
                {isWeb && (
                    <View
                        style={[styles.scanLine, { top: `${scanLinePosition}%` }]}
                        pointerEvents="none"
                    />
                )}

                {/* Web-only: Flicker overlay */}
                {isWeb && showFlicker && (
                    <View style={styles.flickerOverlay} pointerEvents="none" />
                )}

                {/* Web-only: CRT vignette effect */}
                {isWeb && (
                    <View style={styles.vignette} pointerEvents="none" />
                )}

                {/* BIOS-style header */}
                <Animated.View style={[styles.biosHeader, biosStyle]}>
                    <View style={styles.biosLine}>
                        <Text style={styles.biosText}>HAPPY ENGINEERING</Text>
                        <Text style={styles.biosText}>SECURE TERMINAL</Text>
                    </View>
                    <View style={styles.progressContainer}>
                        <Animated.View style={[styles.progressBar, progressStyle]} />
                    </View>
                </Animated.View>

                {/* Boot lines - each appearing one by one */}
                <View style={styles.bootLines}>
                    {visibleLines.map((line, index) => (
                        <Animated.View
                            key={index}
                            style={styles.bootLineRow}
                            entering={FadeIn.duration(150)}
                        >
                            <Text style={getLineStyle(line.type)}>
                                {glitchLine === index ? glitchText : line.text}
                                {renderProgressBar(index, line.progress)}
                            </Text>
                            {index === visibleLines.length - 1 && showCursor && line.type !== 'empty' && (
                                <Animated.Text style={[styles.cursor, cursorStyle]}>█</Animated.Text>
                            )}
                        </Animated.View>
                    ))}

                    {/* Web: Currently typing line */}
                    {isWeb && typingLineIndex >= 0 && typingLineIndex < bootLines.length && (
                        <View style={styles.bootLineRow}>
                            <Text style={getLineStyle(bootLines[typingLineIndex].type)}>
                                {bootLines[typingLineIndex].text.substring(0, typingCharIndex)}
                            </Text>
                            <Animated.Text style={[styles.cursor, cursorStyle]}>█</Animated.Text>
                        </View>
                    )}
                </View>

                {/* ACCESS GRANTED overlay */}
                {phase === 'complete' && (
                    <Animated.View style={[styles.accessGrantedContainer, accessGrantedStyle]}>
                        {/* Web-only: Hexagonal grid overlay */}
                        {isWeb && <View style={styles.hexGrid} pointerEvents="none" />}

                        <View style={styles.accessGrantedBox}>
                            <Text style={styles.accessGrantedLabel}>STATUS</Text>
                            <Text style={styles.accessGranted}>ACCESS GRANTED</Text>
                            <View style={styles.accessGrantedDivider} />
                            <Text style={styles.accessGrantedSub}>WELCOME, OPERATOR</Text>
                        </View>
                    </Animated.View>
                )}

                {/* Web-only: Iris close effect */}
                {isWeb && phase === 'complete' && (
                    <Animated.View style={[styles.irisContainer, irisStyle]} pointerEvents="none">
                        <View style={styles.irisHole} />
                    </Animated.View>
                )}

                {/* Skip hint */}
                <View style={[styles.skipHint, { paddingBottom: insets.bottom + 20 }]}>
                    <Text style={styles.skipText}>{isWeb ? 'click anywhere to skip' : 'tap anywhere to skip'}</Text>
                </View>
            </Animated.View>
        </Pressable>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        paddingHorizontal: 16,
        overflow: 'hidden',
    },
    // Matrix rain
    matrixContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    matrixColumn: {
        position: 'absolute',
        top: 0,
    },
    matrixChar: {
        ...Typography.mono(),
        fontSize: 14,
        color: '#00ff00',
        lineHeight: 16,
    },
    // Scan line
    scanLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(255, 176, 0, 0.1)',
    },
    // Flicker
    flickerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    // CRT vignette
    vignette: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // @ts-ignore - web only
        boxShadow: 'inset 0 0 150px rgba(0,0,0,0.7)',
    },
    // Hex grid
    hexGrid: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.05,
        // @ts-ignore - web only
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffb000' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    },
    // Iris effect
    irisContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
    },
    irisHole: {
        width: '200%',
        height: '200%',
        borderRadius: 9999,
        backgroundColor: 'transparent',
        // @ts-ignore - web only
        boxShadow: '0 0 0 9999px #0a0a0a',
    },
    biosHeader: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: 12,
        zIndex: 10,
    },
    biosLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    biosText: {
        ...Typography.mono('semiBold'),
        fontSize: 12,
        color: '#ffb000',
        letterSpacing: 1,
    },
    progressContainer: {
        height: 3,
        backgroundColor: '#1a1a1a',
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#ffb000',
    },
    bootLines: {
        flex: 1,
        zIndex: 10,
    },
    bootLineRow: {
        flexDirection: 'row',
        minHeight: 18,
    },
    bootLine: {
        ...Typography.mono(),
        fontSize: 13,
        color: '#cc8800',
        lineHeight: 18,
    },
    bootLineHeader: {
        ...Typography.mono('semiBold'),
        fontSize: 13,
        color: '#ffb000',
        lineHeight: 18,
    },
    bootLineSuccess: {
        ...Typography.mono(),
        fontSize: 13,
        color: '#00ff88',
        lineHeight: 18,
    },
    bootLineError: {
        ...Typography.mono(),
        fontSize: 13,
        color: '#ff4444',
        lineHeight: 18,
    },
    bootLineDim: {
        ...Typography.mono(),
        fontSize: 13,
        color: '#888888',
        lineHeight: 18,
    },
    bootLineHex: {
        ...Typography.mono(),
        fontSize: 13,
        color: '#666699',
        lineHeight: 18,
    },
    bootLineScan: {
        ...Typography.mono('semiBold'),
        fontSize: 13,
        color: '#00ccff',
        lineHeight: 18,
    },
    bootLineNetwork: {
        ...Typography.mono(),
        fontSize: 13,
        color: '#ff9900',
        lineHeight: 18,
    },
    // Inline progress
    inlineProgress: {
        ...Typography.mono(),
        fontSize: 13,
        color: '#ffb000',
    },
    progressFilled: {
        color: '#00ff88',
    },
    progressEmpty: {
        color: '#333',
    },
    cursor: {
        ...Typography.mono(),
        fontSize: 13,
        color: '#ffb000',
        lineHeight: 18,
    },
    accessGrantedContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
        zIndex: 20,
    },
    accessGrantedBox: {
        borderWidth: 2,
        borderColor: '#ffb000',
        paddingHorizontal: 40,
        paddingVertical: 24,
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        zIndex: 21,
    },
    accessGrantedLabel: {
        ...Typography.mono(),
        fontSize: 11,
        color: '#666600',
        letterSpacing: 4,
        marginBottom: 8,
    },
    accessGranted: {
        ...Typography.mono('semiBold'),
        fontSize: 22,
        color: '#00ff88',
        letterSpacing: 4,
        // @ts-ignore - web shadow works differently
        textShadowColor: '#00ff88',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    accessGrantedDivider: {
        width: 60,
        height: 1,
        backgroundColor: '#333',
        marginVertical: 12,
    },
    accessGrantedSub: {
        ...Typography.mono(),
        fontSize: 12,
        color: '#ffb000',
        letterSpacing: 2,
    },
    skipHint: {
        alignItems: 'center',
        zIndex: 10,
    },
    skipText: {
        ...Typography.mono(),
        fontSize: 11,
        color: '#444',
        letterSpacing: 1,
    },
});

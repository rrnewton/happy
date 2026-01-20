import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
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

// Boot messages - each line appears one by one
const BOOT_LINES = [
    { text: 'HAPPY BIOS v2.4.1', type: 'header' },
    { text: 'Copyright (c) 2024-2025 Happy Engineering', type: 'header' },
    { text: '', type: 'empty' },
    { text: 'CPU: Neural Processing Unit @ 3.2 THz', type: 'info' },
    { text: 'Memory: 128 PB Quantum RAM... OK', type: 'info' },
    { text: 'Storage: 1 EB Holographic Array... OK', type: 'info' },
    { text: '', type: 'empty' },
    { text: 'Initializing kernel...', type: 'dim' },
    { text: 'Loading drivers...', type: 'dim' },
    { text: '[  OK  ] Started Cryptographic Services', type: 'success' },
    { text: '[  OK  ] Started Neural Network Interface', type: 'success' },
    { text: '[  OK  ] Started Quantum Encryption Module', type: 'success' },
    { text: '[  OK  ] Started Secure Socket Layer', type: 'success' },
    { text: '[  OK  ] Started Authentication Daemon', type: 'success' },
    { text: '[  OK  ] Started Happy Core Services', type: 'success' },
    { text: '', type: 'empty' },
    { text: 'System ready.', type: 'info' },
];

/**
 * Iron Man-style boot sequence animation.
 * Shows lines appearing one by one with staggered timing.
 */
export const BootSequence = React.memo(function BootSequence({ onComplete }: BootSequenceProps) {
    const insets = useSafeAreaInsets();
    const [visibleLineCount, setVisibleLineCount] = React.useState(0);
    const [phase, setPhase] = React.useState<'boot' | 'complete'>('boot');
    const [showCursor, setShowCursor] = React.useState(true);

    // Animation values
    const biosOpacity = useSharedValue(0);
    const accessGrantedOpacity = useSharedValue(0);
    const accessGrantedScale = useSharedValue(0.8);
    const containerOpacity = useSharedValue(1);
    const cursorOpacity = useSharedValue(1);
    const progressWidth = useSharedValue(0);

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

    // Start the boot sequence - show lines one by one
    React.useEffect(() => {
        // Show BIOS header immediately
        biosOpacity.value = withTiming(1, { duration: 300 });

        // Start progress bar
        const totalDuration = BOOT_LINES.length * 120 + 800; // Approximate total time
        progressWidth.value = withTiming(100, {
            duration: totalDuration,
            easing: Easing.linear,
        });

        // Show lines one by one with staggered delays
        let currentLine = 0;
        const showNextLine = () => {
            if (currentLine < BOOT_LINES.length) {
                setVisibleLineCount(currentLine + 1);
                currentLine++;

                // Variable delay based on line type for more realistic feel
                const line = BOOT_LINES[currentLine - 1];
                let delay = 100; // Base delay

                if (line.type === 'empty') {
                    delay = 50; // Empty lines are quick
                } else if (line.type === 'header') {
                    delay = 150; // Headers slightly slower
                } else if (line.type === 'success') {
                    delay = 80; // Service starts are fast
                } else if (line.type === 'dim') {
                    delay = 200; // "Loading..." lines pause longer
                }

                setTimeout(showNextLine, delay);
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
    }, []);

    // When boot is complete, show ACCESS GRANTED and fade out
    React.useEffect(() => {
        if (phase === 'complete') {
            // Show ACCESS GRANTED with scale animation
            accessGrantedOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
            accessGrantedScale.value = withDelay(200, withSequence(
                withTiming(1.15, { duration: 200, easing: Easing.out(Easing.back(2)) }),
                withTiming(1, { duration: 150 })
            ));

            // Fade out entire container and call onComplete
            const fadeOut = setTimeout(() => {
                containerOpacity.value = withTiming(0, { duration: 500 }, (finished) => {
                    if (finished) {
                        runOnJS(onComplete)();
                    }
                });
            }, 1000);

            return () => clearTimeout(fadeOut);
        }
    }, [phase]);

    // Allow tap to skip
    const handleSkip = React.useCallback(() => {
        containerOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
            if (finished) {
                runOnJS(onComplete)();
            }
        });
    }, [onComplete]);

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
            case 'empty':
                return styles.bootLine;
            default:
                return styles.bootLine;
        }
    };

    // Get visible lines
    const visibleLines = BOOT_LINES.slice(0, visibleLineCount);

    return (
        <Pressable onPress={handleSkip} style={{ flex: 1 }}>
            <Animated.View style={[styles.container, containerStyle, { paddingTop: insets.top + 20 }]}>
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
                                {line.text}
                            </Text>
                            {index === visibleLines.length - 1 && showCursor && line.type !== 'empty' && (
                                <Animated.Text style={[styles.cursor, cursorStyle]}>█</Animated.Text>
                            )}
                        </Animated.View>
                    ))}
                </View>

                {/* ACCESS GRANTED overlay */}
                {phase === 'complete' && (
                    <Animated.View style={[styles.accessGrantedContainer, accessGrantedStyle]}>
                        <View style={styles.accessGrantedBox}>
                            <Text style={styles.accessGrantedLabel}>STATUS</Text>
                            <Text style={styles.accessGranted}>ACCESS GRANTED</Text>
                            <View style={styles.accessGrantedDivider} />
                            <Text style={styles.accessGrantedSub}>WELCOME, OPERATOR</Text>
                        </View>
                    </Animated.View>
                )}

                {/* Skip hint */}
                <View style={[styles.skipHint, { paddingBottom: insets.bottom + 20 }]}>
                    <Text style={styles.skipText}>tap anywhere to skip</Text>
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
    },
    biosHeader: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: 12,
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
    },
    accessGrantedBox: {
        borderWidth: 2,
        borderColor: '#ffb000',
        paddingHorizontal: 40,
        paddingVertical: 24,
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
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
    },
    skipText: {
        ...Typography.mono(),
        fontSize: 11,
        color: '#444',
        letterSpacing: 1,
    },
});

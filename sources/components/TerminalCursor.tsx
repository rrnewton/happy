import * as React from 'react';
import { Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';

interface TerminalCursorProps {
    /**
     * Size of the cursor in pixels. Defaults to 14.
     */
    size?: number;
    /**
     * Color of the cursor. Defaults to theme amber color.
     */
    color?: string;
    /**
     * Whether the cursor is visible. When false, renders nothing.
     */
    visible?: boolean;
    /**
     * Style of cursor: 'block' (█) or 'underscore' (_)
     */
    style?: 'block' | 'underscore';
}

/**
 * Animated blinking terminal cursor component.
 * Used in terminal theme to add that authentic terminal feel.
 */
export const TerminalCursor = React.memo(function TerminalCursor({
    size = 14,
    color,
    visible = true,
    style = 'block',
}: TerminalCursorProps) {
    const { theme } = useUnistyles();
    const opacity = useSharedValue(1);

    React.useEffect(() => {
        if (!visible) return;

        opacity.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 500 }),
                withTiming(1, { duration: 500 })
            ),
            -1,
            false
        );
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    if (!visible) return null;

    const cursorColor = color ?? theme.colors.text;
    const cursorChar = style === 'block' ? '█' : '_';

    return (
        <Animated.Text
            style={[
                {
                    ...Typography.mono(),
                    fontSize: size,
                    color: cursorColor,
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                },
                animatedStyle,
            ]}
        >
            {cursorChar}
        </Animated.Text>
    );
});

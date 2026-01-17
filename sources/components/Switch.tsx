import * as React from 'react';
import { Platform, Switch as RNSwitch, SwitchProps, Pressable, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Deferred } from './Deferred';
import { Typography } from '@/constants/Typography';

/**
 * Terminal-style ON/OFF text toggle that replaces the traditional switch
 * in terminal theme mode. Shows [ON] or [OFF] with appropriate colors.
 */
const TerminalSwitch = React.memo((props: SwitchProps) => {
    const { theme } = useUnistyles();
    const { value, onValueChange, disabled } = props;

    const handlePress = React.useCallback(() => {
        if (!disabled && onValueChange) {
            onValueChange(!value);
        }
    }, [value, onValueChange, disabled]);

    return (
        <Pressable
            onPress={handlePress}
            disabled={disabled}
            hitSlop={8}
            style={{ opacity: disabled ? 0.5 : 1 }}
        >
            <View style={terminalStyles.container}>
                <Text style={[
                    terminalStyles.bracket,
                    { color: theme.colors.textSecondary }
                ]}>
                    [
                </Text>
                <Text style={[
                    terminalStyles.text,
                    { color: value ? theme.colors.success : theme.colors.textSecondary }
                ]}>
                    {value ? 'ON' : 'OFF'}
                </Text>
                <Text style={[
                    terminalStyles.bracket,
                    { color: theme.colors.textSecondary }
                ]}>
                    ]
                </Text>
            </View>
        </Pressable>
    );
});

const terminalStyles = StyleSheet.create((theme) => {
    const terminalUI = theme.colors.terminalUI;
    return {
        container: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        bracket: {
            ...Typography.mono('regular'),
            fontSize: 14,
            // Subtle glow on brackets
            ...(terminalUI.textGlow.enabled ? {
                textShadowColor: terminalUI.textGlow.color,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: terminalUI.textGlow.radius / 4,
            } : {}),
        },
        text: {
            ...Typography.mono('semiBold'),
            fontSize: 14,
            minWidth: 26,
            textAlign: 'center',
            // Stronger glow on ON/OFF text
            ...(terminalUI.textGlow.enabled ? {
                textShadowColor: terminalUI.textGlow.color,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: terminalUI.textGlow.radius,
            } : {}),
        },
    };
});

export const Switch = (props: SwitchProps) => {
    const { theme } = useUnistyles();
    const isTerminal = theme.colors.terminalUI.useMonospace;

    // Use terminal-style text toggle in terminal mode
    if (isTerminal) {
        return <TerminalSwitch {...props} />;
    }

    return (
        <Deferred enabled={Platform.OS === 'android'}>
            <RNSwitch
                {...props}
                trackColor={{ false: theme.colors.switch.track.inactive, true: theme.colors.switch.track.active }}
                ios_backgroundColor={theme.colors.switch.track.inactive}
                thumbColor={theme.colors.switch.thumb.active}
                {...{
                    activeThumbColor: theme.colors.switch.thumb.active,
                }}
            />
        </Deferred>
    );
}
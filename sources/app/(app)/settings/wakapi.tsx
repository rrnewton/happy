import React, { useState, useCallback, memo } from 'react';
import { View, TextInput, Pressable, Linking, Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useHeaderHeight } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Text } from '@/components/StyledText';
import { RoundButton } from '@/components/RoundButton';
import { Modal } from '@/modal';
import { Switch } from '@/components/Switch';
import { useSettingMutable } from '@/sync/storage';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { t } from '@/text';
import { Typography } from '@/constants/Typography';
import { layout } from '@/components/layout';
import { verifyWakapiConnection } from '@/sync/apiWakapi';
import { useHappyAction } from '@/hooks/useHappyAction';

function WakapiSettingsScreen() {
    const { theme } = useUnistyles();
    const headerHeight = useHeaderHeight();

    // Synced settings
    const [wakapiEnabled, setWakapiEnabled] = useSettingMutable('wakapiEnabled');
    const [savedApiUrl, setSavedApiUrl] = useSettingMutable('wakapiApiUrl');
    const [savedApiKey, setSavedApiKey] = useSettingMutable('wakapiApiKey');
    const [proxyEnabled, setProxyEnabled] = useSettingMutable('wakapiProxyEnabled');
    const [savedProxyUrl, setSavedProxyUrl] = useSettingMutable('wakapiProxyUrl');

    // Default proxy URL
    const DEFAULT_PROXY_URL = 'https://cors-proxy.reily.workers.dev';

    // Local state for input fields
    const [apiUrlInput, setApiUrlInput] = useState(savedApiUrl || '');
    const [apiKeyInput, setApiKeyInput] = useState(savedApiKey || '');
    const [proxyUrlInput, setProxyUrlInput] = useState(savedProxyUrl || DEFAULT_PROXY_URL);

    // Show/hide API key
    const [showApiKey, setShowApiKey] = useState(false);

    // Connection status
    const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'testing' | 'connected' | 'error'>('unknown');
    const [connectedUsername, setConnectedUsername] = useState<string | null>(null);

    // Test connection
    const [testingConnection, testConnection] = useHappyAction(async () => {
        if (!apiUrlInput.trim() || !apiKeyInput.trim()) {
            Modal.alert(t('common.error'), t('settingsWakapi.apiUrlAndKeyRequired'));
            return;
        }

        setConnectionStatus('testing');

        const result = await verifyWakapiConnection(
            apiUrlInput.trim(),
            apiKeyInput.trim(),
            proxyEnabled,
            proxyUrlInput.trim() || null
        );

        if (result.success) {
            setConnectionStatus('connected');
            setConnectedUsername(result.username);
            Modal.alert(t('common.success'), t('settingsWakapi.connectionSuccess', { username: result.username }));
        } else {
            setConnectionStatus('error');
            setConnectedUsername(null);
            Modal.alert(t('common.error'), result.error);
        }
    });

    // Save settings
    const handleSave = useCallback(() => {
        if (!apiUrlInput.trim() || !apiKeyInput.trim()) {
            Modal.alert(t('common.error'), t('settingsWakapi.apiUrlAndKeyRequired'));
            return;
        }

        setSavedApiUrl(apiUrlInput.trim());
        setSavedApiKey(apiKeyInput.trim());
        setSavedProxyUrl(proxyUrlInput.trim() || null);
        setWakapiEnabled(true);

        Modal.alert(t('common.success'), t('settingsWakapi.settingsSaved'));
    }, [apiUrlInput, apiKeyInput, proxyUrlInput, setSavedApiUrl, setSavedApiKey, setSavedProxyUrl, setWakapiEnabled]);

    // Disable integration
    const handleDisable = useCallback(() => {
        setWakapiEnabled(false);
        setConnectionStatus('unknown');
        setConnectedUsername(null);
    }, [setWakapiEnabled]);

    const getStatusIcon = () => {
        switch (connectionStatus) {
            case 'connected':
                return <Ionicons name="checkmark-circle" size={20} color="#34C759" />;
            case 'error':
                return <Ionicons name="close-circle" size={20} color="#FF3B30" />;
            case 'testing':
                return <Ionicons name="sync" size={20} color="#007AFF" />;
            default:
                return <Ionicons name="help-circle" size={20} color={theme.colors.textSecondary} />;
        }
    };

    const getStatusText = () => {
        if (wakapiEnabled && savedApiUrl && savedApiKey) {
            if (connectedUsername) {
                return t('settingsWakapi.connectedAs', { username: connectedUsername });
            }
            return t('settingsWakapi.configured');
        }
        return t('settingsWakapi.notConfigured');
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
        >
            <ItemList style={{ paddingTop: 0 }} keyboardShouldPersistTaps="handled">
                {/* Status */}
                <ItemGroup
                    title={t('settingsWakapi.status')}
                    footer={t('settingsWakapi.statusDescription')}
                >
                    <Item
                        title={t('settingsWakapi.codingStats')}
                        subtitle={getStatusText()}
                        icon={<Ionicons name="bar-chart-outline" size={29} color="#007AFF" />}
                        rightElement={
                            <Switch
                                value={wakapiEnabled}
                                onValueChange={(value) => {
                                    if (value && (!savedApiUrl || !savedApiKey)) {
                                        Modal.alert(t('common.error'), t('settingsWakapi.configureFirst'));
                                        return;
                                    }
                                    setWakapiEnabled(value);
                                }}
                            />
                        }
                        showChevron={false}
                    />
                </ItemGroup>

                {/* API Configuration */}
                <ItemGroup
                    title={t('settingsWakapi.apiConfiguration')}
                    footer={t('settingsWakapi.apiConfigurationDescription')}
                >
                    <View style={styles.contentContainer}>
                        {/* API URL */}
                        <View style={styles.labelRow}>
                            <Text style={styles.labelText}>{t('settingsWakapi.apiUrl').toUpperCase()}</Text>
                            <Pressable
                                onPress={() => Linking.openURL('https://wakapi.dev')}
                                style={styles.helpButton}
                            >
                                <Ionicons name="help-circle-outline" size={18} color={theme.colors.textLink} />
                                <Text style={[styles.helpText, { color: theme.colors.textLink }]}>{t('settingsWakapi.whatIsWakapi')}</Text>
                            </Pressable>
                        </View>
                        <TextInput
                            style={[styles.textInput, { color: theme.colors.input.text, backgroundColor: theme.colors.input.background }]}
                            value={apiUrlInput}
                            onChangeText={setApiUrlInput}
                            placeholder="https://wakapi.dev/api"
                            placeholderTextColor={theme.colors.input.placeholder}
                            autoCapitalize="none"
                            autoCorrect={false}
                            spellCheck={false}
                            keyboardType="url"
                        />

                        {/* API Key */}
                        <View style={styles.labelRow}>
                            <Text style={styles.labelText}>{t('settingsWakapi.apiKey').toUpperCase()}</Text>
                        </View>
                        <View style={styles.inputWithButton}>
                            <TextInput
                                style={[styles.textInputFlex, { color: theme.colors.input.text, backgroundColor: theme.colors.input.background }]}
                                value={apiKeyInput}
                                onChangeText={setApiKeyInput}
                                placeholder={t('settingsWakapi.apiKeyPlaceholder')}
                                placeholderTextColor={theme.colors.input.placeholder}
                                autoCapitalize="none"
                                autoCorrect={false}
                                spellCheck={false}
                                secureTextEntry={!showApiKey}
                            />
                            <Pressable
                                style={[styles.showHideButton, { backgroundColor: theme.colors.input.background }]}
                                onPress={() => setShowApiKey(!showApiKey)}
                            >
                                <Ionicons
                                    name={showApiKey ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={theme.colors.textSecondary}
                                />
                            </Pressable>
                        </View>

                        <Text style={styles.hintText}>{t('settingsWakapi.apiKeyHint')}</Text>
                    </View>
                </ItemGroup>

                {/* CORS Proxy (Web only or optional) */}
                {Platform.OS === 'web' && (
                    <ItemGroup
                        title={t('settingsWakapi.corsProxy')}
                        footer={t('settingsWakapi.corsProxyDescription')}
                    >
                        <Item
                            title={t('settingsWakapi.useProxy')}
                            subtitle={t('settingsWakapi.useProxySubtitle')}
                            icon={<Ionicons name="globe-outline" size={29} color="#FF9500" />}
                            rightElement={
                                <Switch
                                    value={proxyEnabled}
                                    onValueChange={setProxyEnabled}
                                />
                            }
                            showChevron={false}
                        />
                        {proxyEnabled && (
                            <View style={styles.contentContainer}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.labelText}>{t('settingsWakapi.proxyUrl').toUpperCase()}</Text>
                                </View>
                                <TextInput
                                    style={[styles.textInput, { color: theme.colors.input.text, backgroundColor: theme.colors.input.background }]}
                                    value={proxyUrlInput}
                                    onChangeText={setProxyUrlInput}
                                    placeholder="https://cors-proxy.reily.workers.dev"
                                    placeholderTextColor={theme.colors.input.placeholder}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    spellCheck={false}
                                    keyboardType="url"
                                />
                            </View>
                        )}
                    </ItemGroup>
                )}

                {/* Actions */}
                <ItemGroup>
                    <View style={styles.contentContainer}>
                        <View style={styles.buttonRow}>
                            <RoundButton
                                title={t('settingsWakapi.testConnection')}
                                size="normal"
                                style={{ flex: 1 }}
                                onPress={testConnection}
                                loading={testingConnection}
                            />
                            <View style={{ width: 12 }} />
                            <RoundButton
                                title={t('settingsWakapi.save')}
                                size="normal"
                                style={{ flex: 1 }}
                                onPress={handleSave}
                            />
                        </View>
                    </View>
                </ItemGroup>
            </ItemList>
        </KeyboardAvoidingView>
    );
}

export default memo(WakapiSettingsScreen);

const styles = StyleSheet.create((theme) => ({
    contentContainer: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        width: '100%',
        maxWidth: layout.maxWidth,
        alignSelf: 'center',
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 8,
    },
    labelText: {
        ...Typography.default('semiBold'),
        fontSize: 12,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    helpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    helpText: {
        ...Typography.default(),
        fontSize: 12,
    },
    textInput: {
        padding: 12,
        borderRadius: 8,
        ...Typography.mono(),
        fontSize: 14,
        marginBottom: 8,
    },
    inputWithButton: {
        flexDirection: 'row',
        marginBottom: 8,
        gap: 8,
    },
    textInputFlex: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        ...Typography.mono(),
        fontSize: 14,
    },
    showHideButton: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    hintText: {
        ...Typography.default(),
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 4,
        lineHeight: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 8,
    },
}));

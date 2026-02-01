import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { useSettingMutable, useLocalSettingMutable } from '@/sync/storage';
import { Switch } from '@/components/Switch';
import { t } from '@/text';
import { webNotificationManager } from '@/utils/webNotifications';
import { Modal } from '@/modal';

export default function FeaturesSettingsScreen() {
    const [experiments, setExperiments] = useSettingMutable('experiments');
    const [commandPaletteEnabled, setCommandPaletteEnabled] = useLocalSettingMutable('commandPaletteEnabled');
    const [markdownCopyV2, setMarkdownCopyV2] = useLocalSettingMutable('markdownCopyV2');
    const [autoCopyOnSelection, setAutoCopyOnSelection] = useLocalSettingMutable('autoCopyOnSelection');
    const [hideInactiveSessions, setHideInactiveSessions] = useSettingMutable('hideInactiveSessions');
    const [shiftEnterToSend, setShiftEnterToSend] = useLocalSettingMutable('shiftEnterToSend');
    const [webNotificationsEnabled, setWebNotificationsEnabled] = useLocalSettingMutable('webNotificationsEnabled');

    return (
        <ItemList style={{ paddingTop: 0 }}>
            {/* Input Behavior */}
            <ItemGroup
                title={t('settingsFeatures.inputBehavior')}
                footer={t('settingsFeatures.inputBehaviorDescription')}
            >
                <Item
                    title={t('settingsFeatures.shiftEnterToSend')}
                    subtitle={shiftEnterToSend ? t('settingsFeatures.shiftEnterToSendEnabled') : t('settingsFeatures.shiftEnterToSendDisabled')}
                    icon={<Ionicons name="return-down-back-outline" size={29} color="#007AFF" />}
                    rightElement={
                        <Switch
                            value={shiftEnterToSend}
                            onValueChange={setShiftEnterToSend}
                        />
                    }
                    showChevron={false}
                />
            </ItemGroup>

            {/* Experimental Features */}
            <ItemGroup
                title={t('settingsFeatures.experiments')}
                footer={t('settingsFeatures.experimentsDescription')}
            >
                <Item
                    title={t('settingsFeatures.experimentalFeatures')}
                    subtitle={experiments ? t('settingsFeatures.experimentalFeaturesEnabled') : t('settingsFeatures.experimentalFeaturesDisabled')}
                    icon={<Ionicons name="flask-outline" size={29} color="#5856D6" />}
                    rightElement={
                        <Switch
                            value={experiments}
                            onValueChange={setExperiments}
                        />
                    }
                    showChevron={false}
                />
                <Item
                    title={t('settingsFeatures.markdownCopyV2')}
                    subtitle={t('settingsFeatures.markdownCopyV2Subtitle')}
                    icon={<Ionicons name="text-outline" size={29} color="#34C759" />}
                    rightElement={
                        <Switch
                            value={markdownCopyV2}
                            onValueChange={setMarkdownCopyV2}
                        />
                    }
                    showChevron={false}
                />
                <Item
                    title={t('settingsFeatures.hideInactiveSessions')}
                    subtitle={t('settingsFeatures.hideInactiveSessionsSubtitle')}
                    icon={<Ionicons name="eye-off-outline" size={29} color="#FF9500" />}
                    rightElement={
                        <Switch
                            value={hideInactiveSessions}
                            onValueChange={setHideInactiveSessions}
                        />
                    }
                    showChevron={false}
                />
            </ItemGroup>

            {/* Web-only Features */}
            {Platform.OS === 'web' && (
                <ItemGroup
                    title={t('settingsFeatures.webFeatures')}
                    footer={t('settingsFeatures.webFeaturesDescription')}
                >
                    <Item
                        title={t('settingsFeatures.commandPalette')}
                        subtitle={commandPaletteEnabled ? t('settingsFeatures.commandPaletteEnabled') : t('settingsFeatures.commandPaletteDisabled')}
                        icon={<Ionicons name="keypad-outline" size={29} color="#007AFF" />}
                        rightElement={
                            <Switch
                                value={commandPaletteEnabled}
                                onValueChange={setCommandPaletteEnabled}
                            />
                        }
                        showChevron={false}
                    />
                    <Item
                        title={t('settingsFeatures.autoCopyOnSelection')}
                        subtitle={t('settingsFeatures.autoCopyOnSelectionSubtitle')}
                        icon={<Ionicons name="copy-outline" size={29} color="#34C759" />}
                        rightElement={
                            <Switch
                                value={autoCopyOnSelection}
                                onValueChange={setAutoCopyOnSelection}
                            />
                        }
                        showChevron={false}
                    />
                    <Item
                        title={t('settings.webNotifications.title')}
                        subtitle={t('settings.webNotifications.subtitle')}
                        icon={<Ionicons name="notifications-outline" size={29} color="#FF9500" />}
                        rightElement={
                            <Switch
                                value={webNotificationsEnabled}
                                onValueChange={async (value) => {
                                    if (value) {
                                        // Request permission when enabling
                                        const granted = await webNotificationManager.requestPermission();
                                        if (!granted) {
                                            // Show alert that permission was denied
                                            Modal.alert(
                                                t('settings.webNotifications.permissionDenied'),
                                                t('settings.webNotifications.permissionInstructions'),
                                                [{ text: t('common.ok'), style: 'cancel' }]
                                            );
                                            return;
                                        }
                                    }
                                    setWebNotificationsEnabled(value);
                                }}
                            />
                        }
                        showChevron={false}
                    />
                    {webNotificationsEnabled && (
                        <Item
                            title={t('settings.webNotifications.testNotification')}
                            subtitle={t('settings.webNotifications.testNotificationSubtitle')}
                            icon={<Ionicons name="flask-outline" size={29} color="#5856D6" />}
                            onPress={() => {
                                const permission = webNotificationManager.getPermission();
                                if (permission !== 'granted') {
                                    Modal.alert(
                                        t('settings.webNotifications.permissionDenied'),
                                        t('settings.webNotifications.permissionInstructions'),
                                        [{ text: t('common.ok'), style: 'cancel' }]
                                    );
                                    return;
                                }

                                // Show alert that notification will appear in 5 seconds
                                Modal.alert(
                                    'Test Scheduled',
                                    'A test notification will appear in 5 seconds. You can switch to another tab to test background notifications.',
                                    [{ text: t('common.ok'), style: 'cancel' }]
                                );

                                // Show test notification after 5 seconds
                                setTimeout(() => {
                                    const notification = new Notification('Test Notification', {
                                        body: 'This is how notifications will appear when sessions are ready',
                                        icon: '/icon.png',
                                        requireInteraction: false,
                                    });

                                    notification.onclick = () => {
                                        window.focus();
                                        notification.close();
                                    };
                                }, 5000);
                            }}
                            showChevron={false}
                        />
                    )}
                </ItemGroup>
            )}
        </ItemList>
    );
}

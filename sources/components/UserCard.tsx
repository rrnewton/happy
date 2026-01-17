import React from 'react';
import { UserProfile, getDisplayName } from '@/sync/friendTypes';
import { Item } from '@/components/Item';
import { Ionicons } from '@expo/vector-icons';
import { useUnistyles } from 'react-native-unistyles';
import { View } from 'react-native';

interface UserCardProps {
    user: UserProfile;
    onPress?: () => void;
}

export function UserCard({
    user,
    onPress
}: UserCardProps) {
    const { theme } = useUnistyles();
    const displayName = getDisplayName(user);

    // Create icon element instead of avatar
    const iconElement = (
        <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.divider,
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Ionicons name="person" size={20} color={theme.colors.textSecondary} />
        </View>
    );

    // Create subtitle
    const subtitle = `@${user.username}`;

    return (
        <Item
            title={displayName}
            subtitle={subtitle}
            subtitleLines={1}
            leftElement={iconElement}
            onPress={onPress}
            showChevron={!!onPress}
        />
    );
}

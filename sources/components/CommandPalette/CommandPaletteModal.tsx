import React from 'react';
import {
    View,
    Modal,
    TouchableWithoutFeedback,
    StyleSheet,
    KeyboardAvoidingView,
    Platform
} from 'react-native';

interface CommandPaletteModalProps {
    visible: boolean;
    onClose?: () => void;
    children: React.ReactNode;
}

export function CommandPaletteModal({
    visible,
    onClose,
    children
}: CommandPaletteModalProps) {
    const handleClose = React.useCallback(() => {
        if (onClose) {
            onClose();
        }
    }, [onClose]);

    const handleBackdropPress = () => {
        handleClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableWithoutFeedback onPress={handleBackdropPress}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                <View style={styles.content}>
                    {children}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        // Position at 30% from top of viewport
        ...(Platform.OS === 'web' ? {
            paddingTop: '30vh',
        } as any : {
            paddingTop: 200, // Fallback for native
        })
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 15, 15, 0.75)',
        // Remove blur for better performance - use darker overlay instead
        // Blur can be re-enabled if needed but with optimizations
        ...(Platform.OS === 'web' ? {
            // backdropFilter: 'blur(2px)',
            // WebkitBackdropFilter: 'blur(2px)',
            // willChange: 'backdrop-filter',
            // transform: 'translateZ(0)', // Force GPU acceleration
        } as any : {})
    },
    content: {
        zIndex: 1,
        width: '90%',
        maxWidth: 800, // Increased from 640
    }
});
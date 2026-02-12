import React from 'react';
import { BaseModal } from './BaseModal';
import { CustomModalConfig } from '../types';
import { CommandPaletteModal } from '@/components/CommandPalette/CommandPaletteModal';
import { CommandPalette } from '@/components/CommandPalette';

interface CustomModalProps {
    config: CustomModalConfig;
    onClose: () => void;
}

export function CustomModal({ config, onClose }: CustomModalProps) {
    const Component = config.component;
    
    // Use special modal wrapper for CommandPalette with animation support
    if (Component === CommandPalette) {
        return <CommandPaletteWithAnimation config={config} onClose={onClose} />;
    }
    
    return (
        <BaseModal visible={true} onClose={onClose}>
            <Component {...config.props} onClose={onClose} />
        </BaseModal>
    );
}

// Helper component for CommandPalette modal wrapper
function CommandPaletteWithAnimation({ config, onClose }: CustomModalProps) {
    return (
        <CommandPaletteModal visible={true} onClose={onClose}>
            <CommandPalette {...config.props} onClose={onClose} />
        </CommandPaletteModal>
    );
}
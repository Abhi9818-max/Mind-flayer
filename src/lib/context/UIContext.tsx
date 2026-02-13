"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
    isFilterOpen: boolean;
    toggleFilter: () => void;
    closeFilter: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const toggleFilter = () => setIsFilterOpen(prev => !prev);
    const closeFilter = () => setIsFilterOpen(false);

    return (
        <UIContext.Provider value={{ isFilterOpen, toggleFilter, closeFilter }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}

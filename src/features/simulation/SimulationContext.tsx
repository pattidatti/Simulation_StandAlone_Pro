import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';

type TabType = 'MAP' | 'VILLAGE' | 'INVENTORY' | 'MARKET' | 'UPGRADES' | 'SKILLS' | 'DIPLOMACY' | 'HIERARCHY' | 'PROFILE' | 'ACTIVITY' | 'PRODUCTION' | 'SETTINGS' | 'POLITICS' | 'WAR_ROOM' | 'SIEGE';
type MinigameType = 'WORK' | 'CHOP' | 'CRAFT' | 'MILL' | 'DEFEND' | 'EXPLORE' | 'MINE' | 'QUARRY' | 'PATROL' | 'FORAGE' | 'REFINE' | 'PLANT' | 'HARVEST' | 'SMELT' | 'BAKE' | 'WEAVE' | 'MIX' | 'SAWMILL' | 'GATHER_WOOL' | 'HUNT' | 'TRAVEL_START' | 'SAILING' | null;

interface ProductionContext {
    buildingId: string;
    type: 'REFINE' | 'CRAFT';
    initialView?: 'PRODUCE' | 'REPAIR';
}


interface SimulationContextType {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    viewMode: string;
    setViewMode: (mode: string) => void;
    isMarketOpen: boolean;
    setMarketOpen: (isOpen: boolean) => void;
    activeMinigame: MinigameType;
    setActiveMinigame: (game: MinigameType) => void;
    activeMinigameMethod: string | null;
    setActiveMinigameMethod: (method: string | null) => void;
    activeMinigameAction: any | null;
    setActiveMinigameAction: (action: any | null) => void;
    actionLoading: string | null;
    setActionLoading: (action: string | null) => void;
    productionContext: ProductionContext | null;
    setProductionContext: (ctx: ProductionContext | null) => void;
    viewingRegionId: string | null;
    setViewingRegionId: (id: string | null) => void;
    // Music Window State
    isMusicWindowOpen: boolean;
    setMusicWindowOpen: (isOpen: boolean) => void;
}


const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { pin, tab } = useParams<{ pin: string; tab?: string }>();

    // Helper: URL slug <-> Internal State
    const getTabFromUrl = (urlTab?: string): TabType => {
        if (!urlTab) return 'MAP';
        const t = urlTab.toUpperCase();
        if (t === 'ACTIVITY' || t === 'LOG') return 'ACTIVITY';
        return t as TabType;
    };

    const getUrlFromTab = (t: TabType): string => {
        return t.toLowerCase();
    };

    // State is initialized ONCE from the URL. 
    // Subsequent updates are local to prevent router re-renders (immersion breaking).
    const [activeTab, setActiveTabState] = useState<TabType>(() => getTabFromUrl(tab));

    const [viewMode, setViewMode] = useState<string>('global');
    const [viewingRegionId, setViewingRegionId] = useState<string | null>(null);

    const [isMarketOpen, setMarketOpen] = useState(false);
    const [isMusicWindowOpen, setMusicWindowOpen] = useState(false);
    const [activeMinigame, setActiveMinigame] = useState<MinigameType>(null);
    const [activeMinigameMethod, setActiveMinigameMethod] = useState<string | null>(null);
    const [activeMinigameAction, setActiveMinigameAction] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [productionContext, setProductionContext] = useState<ProductionContext | null>(null);

    // Custom setter that updates state + silently updates URL
    const setActiveTab = (newTab: TabType) => {
        setActiveTabState(newTab);

        // Silently update URL without triggering React Router navigation/suspense
        const slug = getUrlFromTab(newTab);
        const newUrl = `${import.meta.env.BASE_URL}play/${pin}/${slug}`;
        window.history.replaceState({ ...window.history.state, idx: window.history.length }, '', newUrl);
    };

    // Sync activeTab with interactions
    const handleSetMarketOpen = (isOpen: boolean) => {
        setMarketOpen(isOpen);
        if (isOpen) setActiveTab('MARKET');
        else if (activeTab === 'MARKET') setActiveTab('MAP');
    };

    return (
        <SimulationContext.Provider value={{
            activeTab,
            setActiveTab,
            viewMode,
            setViewMode,
            viewingRegionId,
            setViewingRegionId,
            isMarketOpen,
            setMarketOpen: handleSetMarketOpen,
            isMusicWindowOpen,
            setMusicWindowOpen,
            activeMinigame,
            setActiveMinigame,
            activeMinigameMethod,
            setActiveMinigameMethod,
            activeMinigameAction,
            setActiveMinigameAction,
            actionLoading,
            setActionLoading,
            productionContext,
            setProductionContext
        }}>
            {children}
        </SimulationContext.Provider>
    );
};

export const useSimulation = () => {
    const context = useContext(SimulationContext);
    if (!context) {
        throw new Error('useSimulation must be used within a SimulationProvider');
    }
    return context;
};

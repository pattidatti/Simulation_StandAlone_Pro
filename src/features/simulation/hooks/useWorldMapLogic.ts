import { useState, useEffect, useCallback } from 'react';
import { useSimulation } from '../SimulationContext';
import { POINTS_OF_INTEREST } from '../data/WorldMapData';
import { CRAFTING_RECIPES } from '../constants';
import { TAVERN_NPCS } from '../TavernData';
import type { TavernNPC } from '../TavernData';

export function useWorldMapLogic(player: any, onAction: (a: any) => void, onOpenMarket: () => void) {
    const {
        setActiveTab,
        setProductionContext,
        viewMode,
        setViewMode,
        viewingRegionId: ctxViewingRegionId,
        setViewingRegionId,
        activeTab
    } = useSimulation();

    const viewingRegionId = ctxViewingRegionId || player.regionId || 'capital';

    const [selectedPOI, setSelectedPOI] = useState<any>(null);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [upgradingBuildingId, setUpgradingBuildingId] = useState<string | null>(null);
    const [dialogNPC, setDialogNPC] = useState<TavernNPC | null>(null);
    const [dialogStep, setDialogStep] = useState<string>('start');
    const [isDiceGameOpen, setIsDiceGameOpen] = useState(false);
    const [isChickenCoopOpen, setIsChickenCoopOpen] = useState(false);
    const [isConstructionOpen, setIsConstructionOpen] = useState(false);
    const [isTaxationOpen, setIsTaxationOpen] = useState(false);
    const [isGambleGameOpen, setIsGambleGameOpen] = useState(false);
    const [isGrainGameOpen, setIsGrainGameOpen] = useState(false);
    const [isShipyardOpen, setIsShipyardOpen] = useState(false);
    const [isSailingOpen, setIsSailingOpen] = useState(false);
    const [isWharfUpgradeOpen, setIsWharfUpgradeOpen] = useState(false);
    const [isFlaxGameOpen, setIsFlaxGameOpen] = useState(false);

    const getViewLevel = useCallback((mode: string): number => {
        if (mode === 'kingdom') return 0;
        if (mode === 'global') return 1;
        const poi = POINTS_OF_INTEREST.find(p => p.id === mode);
        if (poi?.parentId) return 3;
        return 2;
    }, []);

    const [lastViewMode, setLastViewMode] = useState(viewMode);
    const [direction, setDirection] = useState<'in' | 'out'>('in');

    if (viewMode !== lastViewMode) {
        const prevLevel = getViewLevel(lastViewMode);
        const currLevel = getViewLevel(viewMode);
        if (currLevel > prevLevel) setDirection('in');
        else if (currLevel < prevLevel) setDirection('out');
        setLastViewMode(viewMode);
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (activeTab !== 'MAP') return;
                if (upgradingBuildingId) { setUpgradingBuildingId(null); return; }
                if (isDiceGameOpen) { setIsDiceGameOpen(false); return; }
                if (isChickenCoopOpen) { setIsChickenCoopOpen(false); return; }
                if (isTaxationOpen) { setIsTaxationOpen(false); return; }
                if (isGambleGameOpen) { setIsGambleGameOpen(false); return; }
                if (isGrainGameOpen) { setIsGrainGameOpen(false); return; }
                if (isShipyardOpen) { setIsShipyardOpen(false); return; }
                if (isSailingOpen) { setIsSailingOpen(false); return; }
                if (isFlaxGameOpen) { setIsFlaxGameOpen(false); return; }
                if (dialogNPC) { setDialogNPC(null); return; }
                if (selectedEvent) { setSelectedEvent(null); return; }
                if (selectedPOI) { setSelectedPOI(null); return; }
                if (viewMode !== 'kingdom') {
                    const currentHub = POINTS_OF_INTEREST.find(p => p.id === viewMode);
                    const parentHub = currentHub?.parentId ? POINTS_OF_INTEREST.find(p => p.id === currentHub.parentId) : null;
                    if (viewMode === 'global') setViewMode('kingdom');
                    else if (parentHub) setViewMode(parentHub.id);
                    else setViewMode('global');
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewMode, upgradingBuildingId, isDiceGameOpen, isChickenCoopOpen, isTaxationOpen, dialogNPC, selectedEvent, selectedPOI, setViewMode, activeTab]);

    const handlePOIAction = useCallback((poiId: string, actionId: any) => {
        const actId = typeof actionId === 'string' ? actionId : (actionId.type || actionId.id);
        const getProductionContext = (pId: string): { buildingId: string, type: 'REFINE' | 'CRAFT' } | null => {
            if (pId === 'windmill_stones') return { buildingId: 'windmill', type: 'REFINE' };
            if (pId === 'sawmill_blade') return { buildingId: 'sawmill', type: 'REFINE' };
            if (pId === 'smeltery_furnace') return { buildingId: 'smeltery', type: 'REFINE' };
            if (pId === 'bakery_oven') return { buildingId: 'bakery', type: 'REFINE' };
            if (pId === 'weavery_loom') return { buildingId: 'weavery', type: 'REFINE' };
            if (pId === 'forge_anvil') return { buildingId: 'great_forge', type: 'CRAFT' };
            if (pId === 'apothecary_bench') return { buildingId: 'apothecary', type: 'CRAFT' };
            return null;
        };

        if (actId === 'OPEN_CHICKEN_COOP') {
            setIsChickenCoopOpen(true);
            setSelectedPOI(null);
            return;
        }

        if (actId === 'OPEN_GARRISON') {
            setProductionContext({ buildingId: 'watchtower', type: 'CRAFT', initialView: 'PRODUCE' });
            setActiveTab('PRODUCTION');
            setSelectedPOI(null);
            return;
        }

        if (actId === 'OPEN_CONSTRUCTION') {
            setIsConstructionOpen(true);
            setSelectedPOI(null);
            return;
        }

        if (actId === 'OPEN_WAR_ROOM') {
            setActiveTab('WAR_ROOM');
            setSelectedPOI(null);
            return;
        }

        if (actId === 'OPEN_TAXATION') {
            setIsTaxationOpen(true);
            setSelectedPOI(null);
            return;
        }

        if (actId === 'OPEN_SHIPYARD') {
            setIsShipyardOpen(true);
            setSelectedPOI(null);
            return;
        }

        if (actId === 'START_SAILING') {
            setIsSailingOpen(true);
            setSelectedPOI(null);
            return;
        }

        if (actId === 'OPEN_WHARF_UPGRADE') {
            setIsWharfUpgradeOpen(true);
            setSelectedPOI(null);
            return;
        }

        const prodCtx = getProductionContext(poiId);
        if (prodCtx && (actId === 'OPEN_CRAFTING' || actId === 'CRAFT' || actId === 'REFINE' || actId.startsWith('REFINE_') || actId.startsWith('CRAFT_') || (CRAFTING_RECIPES as any)[actId] || actId === 'REPAIR')) {
            setProductionContext({ ...prodCtx, initialView: actId === 'REPAIR' ? 'REPAIR' : 'PRODUCE' });
            setActiveTab('PRODUCTION');
            setSelectedPOI(null);
            return;
        }

        const isHomeRegion = viewingRegionId === player.regionId;
        const isKing = player.role === 'KING';
        if (!isHomeRegion && !isKing && actId !== 'MARKET_VIEW') {
            alert("Du har ingen myndighet i dette baroniet.");
            return;
        }

        if (actId === 'MARKET_VIEW') {
            onOpenMarket();
        } else if (actId.startsWith('REFINE_')) {
            const recipeKey = actId.replace('REFINE_', '').split('_')[0].toLowerCase();
            const recipeMap: any = { 'plank': 'plank', 'flour': 'flour', 'iron': 'iron_ingot', 'steel': 'iron_ingot', 'cloth': 'cloth' };
            onAction({ type: 'REFINE', recipeId: recipeMap[recipeKey] || recipeKey });
        } else if (actId.startsWith('CRAFT_')) {
            const subType = actId.replace('CRAFT_', '').toLowerCase();
            if (subType === 'bread' || subType === 'pie' || subType === 'mead') onAction({ type: 'REFINE', recipeId: subType });
            else onAction({ type: 'CRAFT', subType });
        } else if (actId in CRAFTING_RECIPES) {
            onAction({ type: 'CRAFT', subType: actId });
        } else if (actId.startsWith('BUILDING_UPGRADE_')) {
            const bId = actId.replace('BUILDING_UPGRADE_', '');
            setUpgradingBuildingId(bId);
        } else if (actId === 'OPEN_RESOURCE_GAME') {
            setIsGambleGameOpen(true);
        } else if (actId === 'HARVEST' || actId === 'PLANT') {
            const poi = POINTS_OF_INTEREST.find(p => p.id === poiId);
            const isFlaxField = poi?.label?.toLowerCase().includes('lin') || poiId === 'flax_field';
            const action = poi?.actions?.find(a => a.id === actId);

            if (isFlaxField && actId === 'HARVEST') {
                setIsFlaxGameOpen(true);
            } else if (!isFlaxField && actId === 'HARVEST') {
                setIsGrainGameOpen(true);
            } else {
                // PLANT or other actions go directly to backend
                onAction({ type: actId, ...action, locationId: poiId });
            }
        } else if (actId === 'CHAT_LOCAL') {
            const randomNPC = TAVERN_NPCS[Math.floor(Math.random() * TAVERN_NPCS.length)];
            setDialogNPC(randomNPC);
            setDialogStep('start');
        } else if (actId === 'BUY_MEAL') {
            onAction({ type: 'BUY_MEAL' });
        } else {
            onAction(actId);
        }
        setSelectedPOI(null);
    }, [viewingRegionId, player, onAction, onOpenMarket, setActiveTab, setProductionContext, setSelectedPOI]);

    return {
        viewMode,
        setViewMode,
        viewingRegionId,
        setViewingRegionId,
        selectedPOI,
        setSelectedPOI,
        selectedEvent,
        setSelectedEvent,
        upgradingBuildingId,
        setUpgradingBuildingId,
        dialogNPC,
        setDialogNPC,
        dialogStep,
        setDialogStep,
        isDiceGameOpen,
        setIsDiceGameOpen,
        isChickenCoopOpen,
        setIsChickenCoopOpen,
        isConstructionOpen,
        setIsConstructionOpen,
        isTaxationOpen,
        setIsTaxationOpen,
        isGambleGameOpen,
        setIsGambleGameOpen,
        isGrainGameOpen,
        setIsGrainGameOpen,
        isShipyardOpen,
        setIsShipyardOpen,
        isSailingOpen,
        setIsSailingOpen,
        isWharfUpgradeOpen,
        setIsWharfUpgradeOpen,
        isFlaxGameOpen,
        setIsFlaxGameOpen,
        direction,
        handlePOIAction
    };
}

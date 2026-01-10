# Merchant Expansion: The Caravan & The Road

## 1. Design Philosophy: "The Liminal Road"
The travel between regions shouldn't feel like a loading screen. It should be an atmospheric journey.
- **Visual Style**: High-contrast silhouettes. The landscape of central europe rendered in deep slates and charcoal grays.
- **The "Glow"**: The Caravan's lanterns are the only source of warmth. Amber and gold light spills onto the road, creating a rhythmic pulse as you travel.
- **Asymmetry**: The side-scroller uses an asymmetric layout for the UI—important cargo info is tucked into a minimalist corner, leaving the road as the hero.

## 2. The Caravan System
The Caravan is the Merchant's "Fortress." It represents their wealth and progress.

### Upgrade Path (Visual & Functional)
| Level | Name | Capacity | Visuals |
| :--- | :--- | :--- | :--- |
| **1** | **Handcart** | 5 items | A single man pushing a small cart. No horses. Slow. |
| **2** | **Rustic Wagon** | 15 items | Simple wooden wagon, one pony. Can handle light mountain paths. |
| **3** | **Covered Carriage** | 40 items | Large canvas roof, Two horses. Protection from rain (less morale loss). |
| **4** | **Iron-Clad Convoy** | 100 items | Metal reinforcements, Four horses. High durability, less bandit damage. |
| **5** | **Merchant Guild-Ship** | 250 items | A massive land-voyager (or coastal skip). The pinnacle of trade. |

### Modules (Bespoke Upgrades)
- **Silk-lined Chests**: Prevents damage to "Luxury" items (Cloth, Cloth, Honey).
- **Hidden Compartments**: Hides 10% of cargo from Bandits.
- **Heavy-Duty Axles**: +10% Speed when fully loaded.
- **Guard Post**: Reduces the duration of Bandit encounters.

## 3. The Traveling Minigame: "The Long Haul"
A side-scrolling experience that tests the Merchant's endurance.

### Gameplay Mechanics
- **Side-Scrolling**: The caravan moves from left to right.
- **Obstacles**:
    - **Potholes/Mud**: Slows you down. Press 'W' to "Heave" (consumes stamina).
    - **Fallen Logs**: Requires "Jump" or "Detour" (loses time).
    - **Bandits**: Rare event. A combat-minigame where you must "Parry" (Space) or "Bribe" (Gold).
- **The "Sweet Spot"**: Keep the speed in the "Golden Zone" (indicated by a minimalist bar). Too fast = Durability loss. Too slow = Morale drain.

## 4. Regional Arbitrage Loop
1. **Source**: In Oslo, Iron is cheap (High supply).
2. **Action**: Load 50 Iron into the Caravan.
3. **The Road**: Travel to Bergen. Experience the side-scroller.
4. **Destination**: In Bergen, Iron is rare (High demand). Sell for 3x profit. 
5. **Return**: Buy Fish/Wool in Bergen, bring back to Oslo.

## 5. Technical Architecture
- **State**: `actor.caravan` object storing inventory and level.
- **Component**: `CaravanTravelGame.tsx` (Canvas-based side-scroller).
- **Logic**: `handleStartTravel` and `handleTravelComplete` global actions.
- **SVG**: Dynamically composed SVG components based on `caravan.level` and `caravan.upgrades`.

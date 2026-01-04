
export type AnimationType = 'FLOATING_TEXT' | 'FLYING_RESOURCE' | 'PARTICLE';

export interface BaseAnimationEvent {
    id: string;
    type: AnimationType;
    duration: number;
}

export interface FloatingTextEvent extends BaseAnimationEvent {
    type: 'FLOATING_TEXT';
    text: string;
    x: number;
    y: number;
    color?: string;
}

export interface FlyingResourceEvent extends BaseAnimationEvent {
    type: 'FLYING_RESOURCE';
    resource: string;
    startPoint: { x: number, y: number };
    endPoint: { x: number, y: number };
}

export interface ParticleEvent extends BaseAnimationEvent {
    type: 'PARTICLE';
    x: number;
    y: number;
    color?: string;
}

export type AnimationEvent = FloatingTextEvent | FlyingResourceEvent | ParticleEvent;

type AnimationListener = (event: AnimationEvent) => void;

class AnimationManager {
    private listeners: AnimationListener[] = [];

    subscribe(listener: AnimationListener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private emit(event: AnimationEvent) {
        this.listeners.forEach(l => l(event));
    }

    spawnFloatingText(text: string, x: number, y: number, color?: string) {
        // Add small jitter to prevent pixel-perfect overlap
        const jitterX = (Math.random() - 0.5) * 4; // +/- 2%
        const jitterY = (Math.random() - 0.5) * 4; // +/- 2%

        this.emit({
            id: Math.random().toString(36).substr(2, 9),
            type: 'FLOATING_TEXT',
            text,
            x: x + jitterX,
            y: y + jitterY,
            color,
            duration: 1500
        });
    }

    spawnFlyingResource(resource: string, startX: number, startY: number, endX: number, endY: number) {
        this.emit({
            id: Math.random().toString(36).substr(2, 9),
            type: 'FLYING_RESOURCE',
            resource,
            startPoint: { x: startX, y: startY },
            endPoint: { x: endX, y: endY },
            duration: 1000
        });
    }

    spawnParticles(x: number, y: number, color?: string) {
        this.emit({
            id: Math.random().toString(36).substr(2, 9),
            type: 'PARTICLE',
            x,
            y,
            color,
            duration: 800
        });
    }
}

export const animationManager = new AnimationManager();

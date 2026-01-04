import type { SimulationPlayer, SimulationRoom } from '../../simulationTypes';
import { BotBrain } from './botBrain';
import type { BotDecision } from './botBrain';
import type { BotGenome } from './botGenome';
import { BotEvolution } from './botEvolution';
import { performAction } from '../../actions';

export interface BotLog {
    timestamp: number;
    decision: BotDecision;
    state: any;
}

export class BotInstance {
    public player: SimulationPlayer;
    public genome: BotGenome;
    public brain: BotBrain;
    public startTime: number;
    public history: BotDecision[] = [];
    public status: 'RUNNING' | 'STUCK' | 'SUCCESS' | 'DEAD' = 'RUNNING';
    public lastActionAt: number = 0;
    public stuckThreshold: number = 60000; // 60 seconds

    constructor(player: SimulationPlayer, genome: BotGenome) {
        this.player = player;
        this.genome = genome;
        this.brain = new BotBrain(genome);
        this.startTime = Date.now();
    }

    public async tick(room: SimulationRoom, pin: string) {
        if (this.status !== 'RUNNING') return;

        const decision = this.brain.decide(this.player, room);
        this.history.push(decision);
        if (this.history.length > 20) this.history.shift();

        if (decision.action === 'IDLE') {
            if (Date.now() - this.lastActionAt > this.stuckThreshold) {
                this.status = 'STUCK';
                this.dumpLog('Bottleneck detected: Stuck for > 60s');
            }
            return;
        }

        this.lastActionAt = Date.now();
        const result = await performAction(pin, this.player.id, decision.action);

        if (result.success) {
            // Update local player state from result data if available
            // Note: performAction updates Firebase, but we need to keep track of progress
            // Room data will eventually sync back via onValue in the host component
        } else {
            // console.warn(`Bot ${this.player.name} failed action:`, result.error);
        }

        // Check for promotion
        if (this.player.role === 'KING') {
            this.status = 'SUCCESS';
        }
    }

    public getFitness(): number {
        return BotEvolution.calculateFitness(this.player, this.startTime);
    }

    private dumpLog(reason: string) {
        const log = {
            reason,
            genome: this.genome,
            history: this.history,
            playerState: this.player,
            timestamp: Date.now()
        };
        console.error("AI Training Lab - Game Balance Issue:", log);
        // This will be caught by the UI and displayed
        (window as any).lastAILog = log;
    }
}

export type Action = string;

export interface GameConfig {
  id: string;
  name: string;
  actions: Action[];
  payoffMatrix: Record<Action, Record<Action, number>>;
  description: string;
  equilibriumNote?: string;
  presets: {
    name: string;
    strategy: Record<Action, number>;
  }[];
}

export interface PlayerStrategy {
  probabilities: Record<Action, number>;
}

export interface SimulationResult {
  rounds: number;
  playerAScore: number;
  playerBScore: number;
  winsA: number;
  winsB: number;
  ties: number;
  frequenciesA: Record<Action, number>;
  frequenciesB: Record<Action, number>;
}

export const CLASSIC_RPS: GameConfig = {
  id: 'classic',
  name: 'Classic RPS',
  actions: ['Rock', 'Paper', 'Scissors'],
  description: 'The standard three-move game. In this variant, the uniform strategy (1/3, 1/3, 1/3) is the unique Nash Equilibrium.',
  equilibriumNote: 'In Classic RPS, every move is beaten by exactly one other move and beats exactly one other move. This symmetry leads to a uniform equilibrium.',
  payoffMatrix: {
    Rock: { Rock: 0, Paper: -1, Scissors: 1 },
    Paper: { Rock: 1, Paper: 0, Scissors: -1 },
    Scissors: { Rock: -1, Paper: 1, Scissors: 0 },
  },
  presets: [
    { name: 'Uniform (Nash)', strategy: { Rock: 1/3, Paper: 1/3, Scissors: 1/3 } },
    { name: 'Rock-Heavy', strategy: { Rock: 0.6, Paper: 0.2, Scissors: 0.2 } },
    { name: 'Paper-Heavy', strategy: { Rock: 0.2, Paper: 0.6, Scissors: 0.2 } },
    { name: 'Scissors-Heavy', strategy: { Rock: 0.2, Paper: 0.2, Scissors: 0.6 } },
  ]
};

export const RPS_FIRE_WATER: GameConfig = {
  id: 'rpsfw',
  name: 'RPS Fire Water',
  actions: ['Rock', 'Paper', 'Scissors', 'Fire', 'Water'],
  description: 'A five-move variant where Fire and Water have unique properties. Fire beats all three classic moves but loses to Water. Water loses to all three classic moves but beats Fire.',
  equilibriumNote: 'Unlike Classic RPS, the uniform strategy (0.2 each) is NOT an equilibrium here. Fire is too strong against a uniform opponent. The equilibrium requires playing Fire and Water much more frequently (1/3 each) than the classic moves (1/9 each).',
  payoffMatrix: {
    Rock:     { Rock: 0, Paper: -1, Scissors: 1, Fire: -1, Water: 1 },
    Paper:    { Rock: 1, Paper: 0, Scissors: -1, Fire: -1, Water: 1 },
    Scissors: { Rock: -1, Paper: 1, Scissors: 0, Fire: -1, Water: 1 },
    Fire:     { Rock: 1, Paper: 1, Scissors: 1, Fire: 0, Water: -1 },
    Water:    { Rock: -1, Paper: -1, Scissors: -1, Fire: 1, Water: 0 },
  },
  presets: [
    { name: 'Uniform (Non-Eq)', strategy: { Rock: 0.2, Paper: 0.2, Scissors: 0.2, Fire: 0.2, Water: 0.2 } },
    { name: 'Nash Equilibrium', strategy: { Rock: 1/9, Paper: 1/9, Scissors: 1/9, Fire: 1/3, Water: 1/3 } },
    { name: 'Fire-Heavy', strategy: { Rock: 0.1, Paper: 0.1, Scissors: 0.1, Fire: 0.6, Water: 0.1 } },
    { name: 'Water-Heavy', strategy: { Rock: 0.1, Paper: 0.1, Scissors: 0.1, Fire: 0.1, Water: 0.6 } },
    { name: 'Classic-Heavy', strategy: { Rock: 0.3, Paper: 0.3, Scissors: 0.3, Fire: 0.05, Water: 0.05 } },
  ]
};

export const GAMES: GameConfig[] = [CLASSIC_RPS, RPS_FIRE_WATER];

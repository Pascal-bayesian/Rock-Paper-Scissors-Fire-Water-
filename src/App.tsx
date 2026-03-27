/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Info, 
  Play, 
  RotateCcw, 
  Zap, 
  TrendingUp, 
  Table as TableIcon, 
  Settings2,
  ChevronRight,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import { Action, GameConfig, PlayerStrategy, GAMES, SimulationResult } from './types';

// --- Utility Functions ---

const formatProb = (p: number | undefined) => ((p ?? 0) * 100).toFixed(1) + '%';
const formatVal = (v: number | undefined) => (v ?? 0).toFixed(3);

const normalizeStrategy = (probs: Record<Action, number>, actions: Action[]): Record<Action, number> => {
  const sum = actions.reduce((acc, action) => acc + (probs[action] || 0), 0);
  if (sum === 0) {
    const uniform = 1 / actions.length;
    return actions.reduce((acc, action) => ({ ...acc, [action]: uniform }), {} as Record<Action, number>);
  }
  return actions.reduce((acc, action) => ({ ...acc, [action]: (probs[action] || 0) / sum }), {} as Record<Action, number>);
};

const sampleAction = (strategy: Record<Action, number>, actions: Action[]): Action => {
  const r = Math.random();
  let cumulative = 0;
  for (const action of actions) {
    cumulative += strategy[action];
    if (r <= cumulative) return action;
  }
  return actions[actions.length - 1];
};

// --- Components ---

const Card = ({ title, children, icon: Icon, className = "" }: { title: string, children: React.ReactNode, icon?: any, className?: string }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    <div className="px-4 py-3 border-bottom border-slate-100 bg-slate-50/50 flex items-center gap-2">
      {Icon && <Icon size={18} className="text-slate-500" />}
      <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">{title}</h2>
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);

export default function App() {
  const [selectedGameId, setSelectedGameId] = useState<string>(GAMES[0].id);
  const config = useMemo(() => GAMES.find(g => g.id === selectedGameId) || GAMES[0], [selectedGameId]);

  const [strategyA, setStrategyA] = useState<Record<Action, number>>(() => 
    GAMES[0].actions.reduce((acc, action) => ({ ...acc, [action]: 1 / GAMES[0].actions.length }), {} as Record<Action, number>)
  );
  const [strategyB, setStrategyB] = useState<Record<Action, number>>(() => 
    GAMES[0].actions.reduce((acc, action) => ({ ...acc, [action]: 1 / GAMES[0].actions.length }), {} as Record<Action, number>)
  );

  // Initialize strategies when game changes
  useEffect(() => {
    const initialProbs = config.actions.reduce((acc, action) => ({ ...acc, [action]: 1 / config.actions.length }), {} as Record<Action, number>);
    setStrategyA(initialProbs);
    setStrategyB(initialProbs);
    setSimResult(null);
    setLastRound(null);
  }, [config]);

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [lastRound, setLastRound] = useState<{ a: Action, b: Action, payoff: number } | null>(null);
  const [simRounds, setSimRounds] = useState(1000);

  // --- Derived Data ---

  const expectedPayoffA = useMemo(() => {
    let ev = 0;
    config.actions.forEach(a => {
      config.actions.forEach(b => {
        ev += (strategyA[a] ?? 0) * (strategyB[b] ?? 0) * config.payoffMatrix[a][b];
      });
    });
    return ev;
  }, [strategyA, strategyB, config]);

  const bestResponseA = useMemo(() => {
    const responses = config.actions.map(a => {
      let ev = 0;
      config.actions.forEach(b => {
        ev += (strategyB[b] ?? 0) * config.payoffMatrix[a][b];
      });
      return { action: a, ev };
    });
    return responses.sort((a, b) => b.ev - a.ev);
  }, [strategyB, config]);

  const bestResponseB = useMemo(() => {
    const responses = config.actions.map(b => {
      let ev = 0;
      config.actions.forEach(a => {
        // Payoff for B is negative of payoff for A in zero-sum
        ev += (strategyA[a] ?? 0) * (-config.payoffMatrix[a][b]);
      });
      return { action: b, ev };
    });
    return responses.sort((a, b) => b.ev - a.ev);
  }, [strategyA, config]);

  // --- Handlers ---

  const handleProbChange = (player: 'A' | 'B', action: Action, value: number) => {
    const setter = player === 'A' ? setStrategyA : setStrategyB;
    const current = player === 'A' ? strategyA : strategyB;
    
    // Simple normalization approach: adjust other values proportionally
    // or just let the user edit and normalize on the fly
    const newProbs = { ...current, [action]: value };
    setter(normalizeStrategy(newProbs, config.actions));
  };

  const setPreset = (player: 'A' | 'B', strategy: Record<Action, number>) => {
    const setter = player === 'A' ? setStrategyA : setStrategyB;
    setter(normalizeStrategy(strategy, config.actions));
  };

  const runSimulation = (rounds: number) => {
    let scoreA = 0;
    let scoreB = 0;
    let winsA = 0;
    let winsB = 0;
    let ties = 0;
    const freqA: Record<Action, number> = config.actions.reduce((acc, a) => ({ ...acc, [a]: 0 }), {});
    const freqB: Record<Action, number> = config.actions.reduce((acc, a) => ({ ...acc, [a]: 0 }), {});

    for (let i = 0; i < rounds; i++) {
      const a = sampleAction(strategyA, config.actions);
      const b = sampleAction(strategyB, config.actions);
      const payoff = config.payoffMatrix[a][b];
      
      scoreA += payoff;
      scoreB -= payoff;
      freqA[a]++;
      freqB[b]++;

      if (payoff > 0) winsA++;
      else if (payoff < 0) winsB++;
      else ties++;
    }

    setSimResult({
      rounds,
      playerAScore: scoreA,
      playerBScore: scoreB,
      winsA,
      winsB,
      ties,
      frequenciesA: freqA,
      frequenciesB: freqB
    });
  };

  const playOneRound = () => {
    const a = sampleAction(strategyA, config.actions);
    const b = sampleAction(strategyB, config.actions);
    setLastRound({ a, b, payoff: config.payoffMatrix[a][b] });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Game Theory Sandbox</h1>
            <p className="text-slate-500 mt-1">Exploring Mixed Strategies & Equilibria</p>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Variant:</label>
            <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
              {GAMES.map(game => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGameId(game.id)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    selectedGameId === game.id 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {game.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const nash = config.presets.find(p => p.name.includes('Nash') || p.name.includes('Equilibrium'))?.strategy;
              if (nash) {
                setPreset('A', nash);
                setPreset('B', nash);
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Zap size={16} />
            Set Equilibrium
          </button>
          <button 
            onClick={() => {
              const uniform = config.actions.reduce((acc, a) => ({ ...acc, [a]: 1 / config.actions.length }), {});
              setStrategyA(uniform);
              setStrategyB(uniform);
              setSimResult(null);
              setLastRound(null);
            }}
            className="px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
          >
            <RotateCcw size={16} />
            Reset All
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-4 space-y-6">
          <Card title="Player A Strategy" icon={Settings2}>
            <div className="space-y-6">
              {config.actions.map(action => (
                <div key={action} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-700">{action}</span>
                    <span className="text-indigo-600 font-mono">{formatProb(strategyA[action])}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={strategyA[action] ?? 0} 
                    onChange={(e) => handleProbChange('A', action, parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}
              <div className="pt-4 flex flex-wrap gap-2">
                {config.presets.map(preset => (
                  <button 
                    key={preset.name}
                    onClick={() => setPreset('A', preset.strategy)} 
                    className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Player B Strategy" icon={Settings2}>
            <div className="space-y-6">
              {config.actions.map(action => (
                <div key={action} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-700">{action}</span>
                    <span className="text-rose-600 font-mono">{formatProb(strategyB[action])}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={strategyB[action] ?? 0} 
                    onChange={(e) => handleProbChange('B', action, parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                </div>
              ))}
              <div className="pt-4 flex flex-wrap gap-2">
                {config.presets.map(preset => (
                  <button 
                    key={preset.name}
                    onClick={() => setPreset('B', preset.strategy)} 
                    className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card title="One-Round Play" icon={Play}>
            <div className="space-y-4">
              <button 
                onClick={playOneRound}
                className="w-full py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                Sample One Round
              </button>
              
              <AnimatePresence mode="wait">
                {lastRound && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-center flex-1">
                        <p className="text-xs text-slate-500 uppercase font-bold">Player A</p>
                        <p className="text-lg font-bold text-indigo-600">{lastRound.a}</p>
                      </div>
                      <div className="px-4 text-slate-300 font-bold italic">VS</div>
                      <div className="text-center flex-1">
                        <p className="text-xs text-slate-500 uppercase font-bold">Player B</p>
                        <p className="text-lg font-bold text-rose-600">{lastRound.b}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 text-center">
                      <p className="text-sm font-medium">
                        Result: {lastRound.payoff > 0 ? "A Wins!" : lastRound.payoff < 0 ? "B Wins!" : "It's a Tie!"}
                      </p>
                      <p className="text-xs text-slate-500">Payoff A: {lastRound.payoff} | Payoff B: {-lastRound.payoff}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </div>

        {/* Middle Column: Analysis */}
        <div className="lg:col-span-5 space-y-6">
          <Card title="Expected Payoff Summary" icon={TrendingUp}>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
                <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-1">EV Player A</p>
                <p className={`text-3xl font-mono font-bold ${expectedPayoffA > 0 ? 'text-green-600' : expectedPayoffA < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                  {expectedPayoffA > 0 ? '+' : ''}{formatVal(expectedPayoffA)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-center">
                <p className="text-xs text-rose-600 font-bold uppercase tracking-wider mb-1">EV Player B</p>
                <p className={`text-3xl font-mono font-bold ${-expectedPayoffA > 0 ? 'text-green-600' : -expectedPayoffA < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                  {-expectedPayoffA > 0 ? '+' : ''}{formatVal(-expectedPayoffA)}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 leading-relaxed italic">
                The expected value (EV) represents the average outcome per round if these strategies were played indefinitely.
                In zero-sum games like RPS, one player's gain is exactly the other's loss.
              </p>
            </div>
          </Card>

          <Card title="Joint Probability & Payoff Matrix" icon={TableIcon}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-2 text-left text-slate-400 font-normal">A \ B</th>
                    {config.actions.map(b => (
                      <th key={b} className="p-2 text-center font-semibold text-rose-600">{b}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {config.actions.map(a => (
                    <tr key={a} className="border-b border-slate-100 last:border-0">
                      <td className="p-2 font-semibold text-indigo-600">{a}</td>
                      {config.actions.map(b => {
                        const jointProb = (strategyA[a] ?? 0) * (strategyB[b] ?? 0);
                        const payoff = config.payoffMatrix[a][b];
                        return (
                          <td key={b} className="p-2 text-center">
                            <div className="flex flex-col">
                              <span className="font-mono text-xs font-bold text-slate-700">{formatProb(jointProb)}</span>
                              <span className={`text-[10px] font-bold ${payoff > 0 ? 'text-green-600' : payoff < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                {payoff > 0 ? 'WIN (+1)' : payoff < 0 ? 'LOSE (-1)' : 'TIE (0)'}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Best Response Analysis" icon={Zap}>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">For Player A</h3>
                <div className="space-y-2">
                  {bestResponseA.map((r, i) => (
                    <div key={r.action} className={`p-2 rounded border flex justify-between items-center ${i === 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
                      <span className="text-sm font-medium">{r.action}</span>
                      <span className={`text-xs font-mono font-bold ${r.ev > 0 ? 'text-green-600' : r.ev < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {r.ev > 0 ? '+' : ''}{formatVal(r.ev)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider">For Player B</h3>
                <div className="space-y-2">
                  {bestResponseB.map((r, i) => (
                    <div key={r.action} className={`p-2 rounded border flex justify-between items-center ${i === 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'}`}>
                      <span className="text-sm font-medium">{r.action}</span>
                      <span className={`text-xs font-mono font-bold ${r.ev > 0 ? 'text-green-600' : r.ev < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {r.ev > 0 ? '+' : ''}{formatVal(r.ev)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-slate-500 italic">
              Highlighted moves show the best pure strategy response to the opponent's current mixed strategy.
            </p>
          </Card>

          <Card title="EV Breakdown Formula" icon={Info}>
            <div className="font-mono text-[11px] bg-slate-900 text-slate-300 p-4 rounded-lg overflow-x-auto">
              <div className="text-indigo-400 mb-2">EV(A) = Σ P(A=i) * P(B=j) * Payoff(i,j)</div>
              {config.actions.map(a => (
                <div key={a} className="space-y-1">
                  {config.actions.map(b => {
                    const probA = strategyA[a] ?? 0;
                    const probB = strategyB[b] ?? 0;
                    const payoff = config.payoffMatrix[a][b];
                    const contribution = probA * probB * payoff;
                    if (contribution === 0 && payoff === 0) return null;
                    return (
                      <div key={b} className="flex gap-2">
                        <span className="text-slate-500">[{a} vs {b}]</span>
                        <span>{probA.toFixed(2)} * {probB.toFixed(2)} * {payoff} = </span>
                        <span className={contribution > 0 ? 'text-green-400' : contribution < 0 ? 'text-rose-400' : 'text-slate-400'}>
                          {contribution > 0 ? '+' : ''}{contribution.toFixed(3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-slate-700 text-white font-bold">
                Total EV(A) = {expectedPayoffA.toFixed(3)}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Simulation & Education */}
        <div className="lg:col-span-3 space-y-6">
          <Card title="Simulation Mode" icon={BarChart3}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Rounds</label>
                <select 
                  value={simRounds} 
                  onChange={(e) => setSimRounds(parseInt(e.target.value))}
                  className="w-full p-2 rounded border border-slate-200 text-sm bg-white"
                >
                  <option value={10}>10 Rounds</option>
                  <option value={100}>100 Rounds</option>
                  <option value={1000}>1,000 Rounds</option>
                  <option value={10000}>10,000 Rounds</option>
                </select>
              </div>
              <button 
                onClick={() => runSimulation(simRounds)}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Run Simulation
              </button>

              {simResult && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-slate-50 rounded border border-slate-100">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Score A</p>
                      <p className="text-lg font-bold text-indigo-600">{simResult.playerAScore}</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-100">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Score B</p>
                      <p className="text-lg font-bold text-rose-600">{simResult.playerBScore}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500 font-bold uppercase">
                      <span>Wins A</span>
                      <span>Ties</span>
                      <span>Wins B</span>
                    </div>
                    <div className="h-4 w-full flex rounded-full overflow-hidden bg-slate-100">
                      <div className="bg-indigo-500" style={{ width: `${(simResult.winsA / simResult.rounds) * 100}%` }} />
                      <div className="bg-slate-300" style={{ width: `${(simResult.ties / simResult.rounds) * 100}%` }} />
                      <div className="bg-rose-500" style={{ width: `${(simResult.winsB / simResult.rounds) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-600">
                      <span>{simResult.winsA}</span>
                      <span>{simResult.ties}</span>
                      <span>{simResult.winsB}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-[10px] text-indigo-700 font-bold uppercase mb-1">Empirical Average Payoff (A)</p>
                    <p className="text-xl font-mono font-bold text-indigo-900">
                      {(simResult.playerAScore / simResult.rounds).toFixed(4)}
                    </p>
                    <p className="text-[9px] text-indigo-600 mt-1">
                      Theoretical EV: {expectedPayoffA.toFixed(4)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card title="Game Insights" icon={Info} className="bg-indigo-900 text-white border-indigo-800">
            <div className="space-y-4 text-sm leading-relaxed text-indigo-100">
              {config.id === 'rpsfw' ? (
                <>
                  <p>
                    <strong className="text-white">Why isn't 20% each an equilibrium?</strong> Against a uniform opponent, <strong>Fire</strong> beats 3 moves and loses to only 1, giving it an EV of <span className="text-green-400 font-bold">+0.400</span>.
                  </p>
                  <p>
                    Conversely, <strong>Water</strong> loses to 3 moves and beats only 1, giving it an EV of <span className="text-rose-400 font-bold">-0.400</span>.
                  </p>
                  <p>
                    The Nash Equilibrium requires playing Fire and Water more frequently (33.3% each) to balance their power, while the classic moves are played less (11.1% each).
                  </p>
                </>
              ) : (
                <p>
                  In Classic RPS, the symmetry is perfect. Every move has an identical relationship to the others, leading to the intuitive 1/3 uniform equilibrium.
                </p>
              )}
            </div>
          </Card>

          <Card title="Theory & Education" icon={HelpCircle} className="bg-slate-900 text-white border-slate-800">
            <div className="space-y-4 text-sm leading-relaxed text-slate-300">
              <section className="space-y-2">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                  {config.name}
                </h3>
                <p>{config.description}</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                  Equilibrium Note
                </h3>
                <p>{config.equilibriumNote}</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                  Mixed Strategies
                </h3>
                <p>
                  A <strong>mixed strategy</strong> is a probability distribution over possible moves. Instead of always playing Rock, a player might play Rock 60% of the time, Paper 20%, and Scissors 20%.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                  Expected Value (EV)
                </h3>
                <p>
                  The EV is the weighted average of all possible outcomes. It tells us what a player can expect to win or lose on average per round.
                </p>
              </section>
            </div>
          </Card>
        </div>

      </div>

      {/* Footer / Extension Note */}
      <footer className="pt-12 pb-8 border-t border-slate-200 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-600 text-xs font-medium">
          <Info size={14} />
          Pedagogical Tool: Comparing Standard vs Non-Uniform Equilibria
        </div>
        <p className="text-slate-400 text-xs">
          Designed for pedagogical clarity. Built with React, Tailwind, and Motion.
        </p>
      </footer>
    </div>
  );
}

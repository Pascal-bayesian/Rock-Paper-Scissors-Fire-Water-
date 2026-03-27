<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ab6a53de-e8d3-4594-929c-6ec2cc758e23

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
# Mixed Strategy RPS Explorer

An interactive web app for exploring **mixed strategies**, **expected value**, **best responses**, and **simulation** in:

- **Classic Rock–Paper–Scissors**
- **Rock–Paper–Scissors–Fire–Water**

The goal is pedagogical: to make the payoff structure of these games visible and to show how changing the structure of the game changes the equilibrium.

---

## What this app does

This app lets two players choose probability distributions over available moves and then shows:

- each player's mixed strategy
- the **expected payoff** for both players
- the full **joint probability / payoff matrix**
- **best-response analysis**
- repeated-play **simulation**
- the contrast between:
  - a genuine mixed equilibrium
  - a merely intuitive or naive strategy
  - a biased strategy that can be exploited

The app is meant as a compact game-theory sandbox rather than a polished commercial product.

---

## Why this app exists

In ordinary **Rock–Paper–Scissors**, the familiar mixed equilibrium is uniform randomization:

\[
(R,P,S) = \left(\tfrac13,\tfrac13,\tfrac13\right)
\]

But when we move to the 5-action variant **Rock–Paper–Scissors–Fire–Water**, the natural-looking uniform strategy

\[
(0.2,0.2,0.2,0.2,0.2)
\]

is **not** an equilibrium.

This app was built to make that fact visually and numerically transparent.

In the Fire/Water variant used here, the candidate mixed equilibrium is:

\[
(R,P,S,F,W)=\left(\tfrac19,\tfrac19,\tfrac19,\tfrac13,\tfrac13\right)
\]

and the app lets you inspect why.

---

## Included game variants

## 1. Classic Rock–Paper–Scissors

Standard payoff structure:

- Rock beats Scissors
- Paper beats Rock
- Scissors beats Paper
- same move = tie

Payoffs are scored as:

- win = **+1**
- tie = **0**
- loss = **-1**

---

## 2. Rock–Paper–Scissors–Fire–Water

This repo uses the following convention:

- **Rock** beats **Scissors** and **Water**
- **Paper** beats **Rock** and **Water**
- **Scissors** beats **Paper** and **Water**
- **Fire** beats **Rock**, **Paper**, and **Scissors**
- **Water** beats **Fire**
- identical moves tie

From Player A’s perspective, the payoff matrix is:

| A \ B | Rock | Paper | Scissors | Fire | Water |
|---|---:|---:|---:|---:|---:|
| Rock | 0 | -1 | 1 | -1 | 1 |
| Paper | 1 | 0 | -1 | -1 | 1 |
| Scissors | -1 | 1 | 0 | -1 | 1 |
| Fire | 1 | 1 | 1 | 0 | -1 |
| Water | -1 | -1 | -1 | 1 | 0 |

This structure is not symmetric in the same way ordinary RPS is. In particular:

- **Fire** beats three moves and loses to only one
- **Water** beats only Fire and loses to three moves

That asymmetry is exactly why uniform 20% play is not optimal.

---

## Main features

- editable mixed strategies for **Player A** and **Player B**
- expected payoff for both players
- full joint probability / payoff table
- best pure response against the opponent’s current mixture
- simulation mode over repeated rounds
- preset strategies, including:
  - uniform play
  - biased play
  - Fire-heavy / Water-heavy
  - candidate Nash equilibrium for the Fire/Water variant

---

## What the app illustrates

## Classic RPS
In classic RPS, uniform randomization is the mixed-strategy equilibrium.  
If both players use:

\[
(R,P,S)=\left(\tfrac13,\tfrac13,\tfrac13\right)
\]

then expected payoff is 0, and no pure move has an advantage.

## Fire/Water variant
In the Fire/Water game, uniform 20% play is **not** an equilibrium. Against a uniform opponent:

- **Fire** has positive expected payoff
- **Water** has negative expected payoff

So uniform play can be improved upon.

The app also allows you to check the candidate equilibrium:

\[
\left(\tfrac19,\tfrac19,\tfrac19,\tfrac13,\tfrac13\right)
\]

which equalizes the expected payoff of each pure move.

---

## How expected value is computed

For mixed strategies \(p_A(i)\) and \(p_B(j)\), the expected payoff to Player A is:

\[
EV(A)=\sum_{i,j} p_A(i)\,p_B(j)\,u(i,j)
\]

where \(u(i,j)\) is the payoff to A when A plays move \(i\) and B plays move \(j\).

Since these are modeled as zero-sum games:

\[
EV(B) = -EV(A)
\]

The simulation mode is then used to compare:

- the **theoretical expected payoff**
- the **empirical average payoff** over repeated play

---

## Screenshots

Add your screenshots here.

### Classic RPS
![Classic RPS screenshot](./screenshots/classic-rps.png)

### Fire/Water — uniform 20% each
![Fire Water uniform screenshot](./screenshots/fire-water-uniform.png)

### Fire/Water — candidate equilibrium
![Fire Water equilibrium screenshot](./screenshots/fire-water-equilibrium.png)

---

## Running locally

If this project was built with a standard React/Vite setup, use:

```bash
npm install
npm run dev

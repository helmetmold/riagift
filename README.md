# 🍕 Falling Food Frenzy

An arcade-style falling object game where you catch good food and avoid bad food!

## 🚀 Quick Start

### Development Server (with live reload)
```bash
npm run dev
```
This will start a development server at `http://localhost:3000` and automatically reload the page when you make changes to any files.

### Alternative Start Command
```bash
npm start
```
Same as `npm run dev` - starts the development server.

## 🎮 How to Play

1. **Movement**: Use arrow keys (← →) or A/D keys to move left and right
2. **Objective**: Catch good food (🍎🍕🍔🍌🍓🥕🍇🥖) to earn points
3. **Avoid**: Bad food (🦴🗑️💀🧪⚠️🔥💣) - they cost you lives!
4. **Progression**: Game gets harder every 200 points

## 🛠️ Development

The game consists of three main files:
- `index.html` - Game structure and UI
- `styles.css` - All styling and animations
- `game.js` - Game logic, physics, and state management

### Features
- Progressive difficulty system
- Persistent high score tracking (localStorage)
- Particle effects and screen shake
- Responsive design for mobile/desktop
- Modern ES6+ JavaScript

### Making Changes
With the development server running (`npm run dev`), any changes you make to the files will automatically reload the page, so you can see your changes instantly!

## 🎯 Game Mechanics

- **Lives**: Start with 3 lives
- **Scoring**: Good food = 10 + (level × 5) points
- **Levels**: Every 200 points increases difficulty
- **High Scores**: Top 10 scores saved locally

Enjoy the game! 🎮

import Cell from "./Cell";

export default class GameOfLife {
  constructor({
    width,
    height,
    render,
    use_raf,
    bio_mode,
    seed_frame,
    random
  }) {
    this.width = width || 50;
    this.height = height || 50;
    
    this.grid = null;
    this.gridBinary = null;
    this.useRandomGrid = random || false;
    
    seed_frame instanceof Array &&
    seed_frame[0] instanceof Array &&
    typeof seed_frame[0][0] === "number" &&
      (() => {
        this.gridBinary = seed_frame;
        this.height = seed_frame.length;
        this.width = seed_frame[0].length;
      })();
    
    this.bioMode = bio_mode || false;
    this.dutyCycle = [];
    this.frameRegister = [];
    
    this.interval = null;
    this._to = null;
    this.framesElapsed = 0;
    this.useRequestAnimationFrame = use_raf || true;
    this.render = ts => render(this.gridBinary, this.framesElapsed, ts);

    this._populateGameGrid();
  }
}

/*---------------------- RUNNING THE GAME ----------------------*/

GameOfLife.prototype._initializeGame = function(interval, frame_limit = 0) {
  this.interval = interval || 200;

  this.useRequestAnimationFrame
    ? window.requestAnimationFrame(this.render)
    : this.render();

  this._to = this._runGameLoop(frame_limit);
};

GameOfLife.prototype._runGameLoop = function(n) {
  if (n && this.framesElapsed >= n) return clearTimeout(this._to);
  return setTimeout(() => {
    this._dispatchRunDutyCycle();
    this._dispatchApplyRulesToRegister();

    this.useRequestAnimationFrame
      ? window.requestAnimationFrame(this.render)
      : this.render();

    this.framesElapsed++;
    this._to = this._runGameLoop(n);
  }, this.interval);
};

/*------------------------ GAME GRID -------------------------*/

GameOfLife.prototype._populateGameGrid = function() {
  this.gridBinary = this.gridBinary
    ? this.gridBinary
    : this._generateNewBinaryGrid({
        width: this.width,
        height: this.height,
        random: this.useRandomGrid
      });

  this.grid = this.gridBinary.map((row, y) =>
    row.map(
      (cell, x) =>
        new Cell({
          x,
          y,
          living: cell,
          bio_mode: this.bioMode,
          game: this
        })
    )
  );
};

GameOfLife.prototype._generateNewBinaryGrid = function({ width, height, random }) {
  const newGrid = new Array(height).fill(new Array(width).fill(0));
  return random ? this._randomizeGameGrid(newGrid) : newGrid;
};

GameOfLife.prototype._randomizeGameGrid = grid => {
  for (let row in grid)
    grid[row] = grid[row].map(c => (Math.random() > 0.555 ? 1 : 0));
  return grid;
};

/*------------------------- DUTY CYCLE -------------------------*/

GameOfLife.prototype._subscribeCellToDutyCycle = function(callback) {
  this.dutyCycle.push(callback);
};

GameOfLife.prototype._dispatchRunDutyCycle = function() {
  // prettier-ignore
  this.dutyCycle = this.dutyCycle.filter(distributeLifeForce =>
    typeof distributeLifeForce === "function"
      ? (() => {
        distributeLifeForce();
        return false;
      })()
      : false
  );
};

/*---------------------- FRAME REGISTER ----------------------*/

GameOfLife.prototype._subscribeCellToFrameRegister = function(callback) {
  this.frameRegister.push(callback);
};

GameOfLife.prototype._dispatchApplyRulesToRegister = function() {
  // prettier-ignore
  this.frameRegister = this.frameRegister.filter(applyRulesToCell =>
    typeof applyRulesToCell === "function"
      ? (() => {
        applyRulesToCell((coords, living_next) => {
          this.gridBinary[coords[1]][coords[0]] = living_next;
        });
        return false;
      })()
      : false
  );
};

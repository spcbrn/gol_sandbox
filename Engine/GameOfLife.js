class GameOfLife extends GameCore {
  constructor({
    width,
    height,
    render,
    use_raf,
    bio_mode,
    seed_frame,
    random
  }) {
    super();

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
      console.log('whai')
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

import Cell from './Cell';

class Game {
    constructor({
      width,
      height,
      render,
      use_raf,
      string_mode,
      bio_mode,
      seed_frame,
      random
    }) {
      this.width = width || 50;
      this.height = height || 50;
  
      this.render = render || (() => null);
      this.useRaf = use_raf || true;
      this.stringMode = string_mode;
      this.deadChar = "·";
      this.liveChar = "•";
  
      this.interval = null;
      this._to = null;
  
      this.grid = null;
      this.useRandomGrid = random || false;
      this.gridBinary =
        seed_frame instanceof Array &&
        seed_frame[0] instanceof Array &&
        typeof seed_frame[0][0] === "number"
          ? seed_frame
          : null;
  
      this.framesElapsed = 0;
  
      this.bioMode = bio_mode || false;
      this.dutyCycle = [];
      this.frameRegister = [];
    }
  }
  
  /*---------------------- RUNNING THE GAME ----------------------*/
  
  Game.prototype._initializeGame = function(frame_limit, interval) {
    this.interval = interval || 200;
    if (this.stringMode)
      window.requestAnimationFrame(() => this._drawBinaryFrameString());
    else window.requestAnimationFrame(ts => this.render(ts));
    this._to = this.runLoop(frame_limit);
  };
  
  Game.prototype.runLoop = function(n) {
    if (this.framesElapsed >= n) return clearTimeout(this._to);
    return setTimeout(() => {
      this._dispatchRunDutyCycle();
      this._dispatchApplyRulesToRegister();
      if (this.stringMode)
        window.requestAnimationFrame(() => this._drawBinaryFrameString());
      else window.requestAnimationFrame(ts => this.render(ts));
      this.framesElapsed++;
      this._to = this.runLoop(n);
    }, this.interval);
  };
  
  /*------------------------ GAME GRID -------------------------*/
  
  Game.prototype._populateNewGameGrid = function() {
    this.gridBinary = this.gridBinary
      ? this.gridBinary
      : this._generateNewGrid({
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
  
  Game.prototype._generateNewGrid = function({ width, height, random }) {
    const newGrid = new Array(height).fill(new Array(width).fill(0));
    return random ? this._randomizeGameGrid(newGrid) : newGrid;
  };
  
  Game.prototype._randomizeGameGrid = grid => {
    for (let row in grid)
      grid[row] = grid[row].map(c => (Math.random() > 0.555 ? 1 : 0));
    return grid;
  };
  
  /*------------------------- DUTY CYCLE -------------------------*/
  
  Game.prototype._subscribeCellToDutyCycle = function(dist_cell_lifeforce) {
    this.dutyCycle.push(dist_cell_lifeforce);
  };
  
  Game.prototype._dispatchRunDutyCycle = function() {
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
  
  Game.prototype._subscribeCellToFrameRegister = function(apply_cell_rules) {
    this.frameRegister.push(apply_cell_rules);
  };
  
  Game.prototype._dispatchApplyRulesToRegister = function() {
    // prettier-ignore
    this.frameRegister = this.frameRegister.filter(applyRulesToCell =>
      typeof applyRulesToCell === "function"
        ? (() => {
          applyRulesToCell(({ coords, living_next }) => {
            this.gridBinary[coords[1]][coords[0]] = living_next;
          });
          return false;
        })()
        : false
    );
  };
  
  /*---------------------- STRING MODE ----------------------*/
  
  Game.prototype._drawBinaryFrameString = function() {
    if (!this.root) this.root = document.getElementById("gol_root");
    // console.log(this._stripGridBinaryForRender(this.gridBinary))
    this.root.innerHTML = `
      <div style="">
        ${true && this._stripGridBinaryForStringRender(this.gridBinary)}
      </div>
        <br>
      <b>
        ${this.framesElapsed}
      </b>
      <button id="btn">Start</button>
      `;
  };
  
  Game.prototype._stripGridBinaryForStringRender = function(grid) {
    return JSON.stringify(grid)
      .replace(/(\],)/g, "<br>")
      .replace(/(\[|\])|(,|")/g, "")
      .replace(/0/g, this.deadChar + "&nbsp;&nbsp;&nbsp;")
      .replace(/1/g, this.liveChar + "&nbsp;&nbsp;&nbsp;");
  };

function Cell({ x, y, living, bio_mode, game }) {
    this.game = game;
  
    this.coordinates = [x, y];
    this.x = x;
    this.y = y;
    this.key = `${x}.${y}`;
  
    this.nCoords = [];
  
    this.living = living;
    this.bioMode = bio_mode;
  
    this.bioMode &&
      (() => {
        this.dna = [];
        this.art = [];
        this.newArt = [];
      })();
    !this.bioMode && (this.livingNeighbors = 0);
  
    this.subscribedToRegister = false;
  
    this._initializeCell();
  }
  
  Cell.prototype._living = function() {
    return this.living === 1;
  };
  
  Cell.prototype._initializeCell = function() {
    this._living() &&
      (() => {
        this.game._subscribeCellToDutyCycle(() => this._distributeLifeForce());
        this.bioMode &&
          (this.dna = [this.produceDNA(), this.produceDNA(), this.produceDNA()]);
      })();
  };
  
  // prettier-ignore
  Cell.prototype._getNeighborCoordinates = function() {
    return ([
      [-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]
    ]).map(modifier => {
      const nX = this.x + modifier[0];
      const nY = this.y + modifier[1];
  
      return nX >= 0 &&
        nX < this.game.width &&
        nY >= 0 &&
        nY < this.game.height
        ? [nX, nY]
        : null;
    });
  }
  
  Cell.prototype.produceDNA = function() {
    return (
      String.fromCharCode(Math.ceil(Math.random() * 25 + 65)) +
      "•" +
      String.fromCharCode(Math.ceil(Math.random() * 25 + 65))
    );
  };
  Cell.prototype.produceArt = function() {
    return (
      String.fromCharCode(Math.ceil(Math.random() * 103 + 152)) +
      String.fromCharCode(Math.ceil(Math.random() * 103 + 152)) +
      String.fromCharCode(Math.ceil(Math.random() * 103 + 152))
    );
  };
  
  Cell.prototype._distributeLifeForce = function() {
    if (!this.nCoords.length) this.nCoords = this._getNeighborCoordinates();
  
    let nLiving = 0;
    this.nCoords.forEach(n => {
      if (n === null) return;
      const neighbor = this.game.grid[n[1]][n[0]];
      neighbor._living()
        ? (() => {
            neighbor._absorbLifeForce(this.bioMode && this.produceArt());
            nLiving++;
          })()
        : neighbor._absorbLifeForce(this.bioMode && this.produceDNA());
    });
  
    !nLiving &&
      (this.bioMode
        ? this._absorbLifeForce(this.bioMode && this.produceArt())
        : (() => {
            this.game._subscribeCellToFrameRegister(done =>
              this._applyRules(done)
            );
            this.subscribedToRegister = true;
          })());
  
    return false;
  };
  
  // prettier-ignore
  Cell.prototype._absorbLifeForce = function (life_force) {
    this.living
      ? life_force ? this.newArt.push(life_force) : this.livingNeighbors++
      : life_force ? this.dna.push(life_force) : this.livingNeighbors++;
    if (!this.subscribedToRegister) {
      this.game._subscribeCellToFrameRegister(done => this._applyRules(done));
      this.subscribedToRegister = true;
    }
  };
  
  // prettier-ignore
  Cell.prototype._applyRules = function (done) {
    // if (this.x === 17 && this.y === 5) console.log('might i live?')
    // console.log(this.livingNeighbors)
    const n = this.bioMode
      ? this.living ? this.newArt.length : this.dna.length
      : this.livingNeighbors;
    const livingNext =
      this.living === 1
        ? n <= 1 || n >= 4 ? 0 : 1
        : n === 3 ? 1 : 0
  
    livingNext && (() => {
      this.game._subscribeCellToDutyCycle(() => this._distributeLifeForce());
      this.living && this.bioMode &&
         this.art.concat(this.newArt)
    })()
    !livingNext && this.bioMode && (() => {
      // this.living && 
      //   console.log(this.dna.join('') + ' - ' + [ ...this.newArt, ...this.art ].join(''))
      this.dna = [];
    })()
    
    this.living = livingNext;
    this.subscribedToRegister = false;
    this.bioMode
      ? this.newArt = []
      : this.livingNeighbors = 0;
    return done({ coords: this.coordinates, living_next: livingNext });
  }

  const sandboxFrame = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 0, 1],
    [0, 0, 0, 0, 0, 0, 1, 0, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];
  const glider = [
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];
  const tumbler = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    [0, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    [0, 0, 1, 1, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];
  // prettier-ignore
  const ggg = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ]
  
  const gTest = new Game({
    width: 38,
    height: 38,
    string_mode: true,
    bio_mode: false,
    // random: true
    seed_frame: ggg
  });
  
  gTest._populateNewGameGrid();
  // console.log(gTest);
  gTest._initializeGame(1500, 16);
  // console.log(gTest);
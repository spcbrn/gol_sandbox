function Cell({ x, y, living, bio_mode, game }) {
  this.game = game;

  this.coordinates = [x, y];
  this.x = x;
  this.y = y;
  this.key = `${x}.${y}`;

  this.nCoords = [];

  this.living = living;
  this.bioMode = bio_mode;

  bio_mode
    ? (() => {
        this.dna = [];
        this.art = [];
        this.newArt = [];
      })()
    : (this.livingNeighbors = 0);

  this.subscribedToRegister = false;

  this._initializeCell();
}

Cell.prototype.isLiving = function() {
  return this.living === 1;
};

Cell.prototype._initializeCell = function() {
  this.isLiving() &&
    (() => {
      this.game._subscribeCellToDutyCycle(() => this._distributeLifeForce());
      this.bioMode &&
        (this.dna = [
          this._produceBasePair(),
          this._produceBasePair(),
          this._produceBasePair()
        ]);
    })();
};

// prettier-ignore
Cell.prototype._getNeighborCoordinates = function() {
  return this.nModifiers.map(modifier => {
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
// prettier-ignore
Cell.prototype.nModifiers = [
  [-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]
];

Cell.prototype._produceBasePair = function() {
  return (
    String.fromCharCode(Math.ceil(Math.random() * 25 + 65)) +
    String.fromCharCode(Math.ceil(Math.random() * 25 + 65))
  );
};

Cell.prototype._produceArt = function() {
  return (
    String.fromCharCode(Math.ceil(Math.random() * 103 + 152)) +
    String.fromCharCode(Math.ceil(Math.random() * 103 + 152)) +
    String.fromCharCode(Math.ceil(Math.random() * 103 + 152))
  );
};

Cell.prototype._distributeLifeForce = function() {
  !this.nCoords.length && (this.nCoords = this._getNeighborCoordinates());

  let nLiving = 0;
  this.nCoords.forEach(n => {
    if (n === null) return;
    const neighbor = this.game.grid[n[1]][n[0]];
    neighbor.isLiving()
      ? (() => {
          neighbor._absorbLifeForce(this.bioMode && this._produceArt());
          nLiving++;
        })()
      : neighbor._absorbLifeForce(this.bioMode && this._produceBasePair());
  });

  !nLiving &&
    (this.bioMode
      ? this._absorbLifeForce(this._produceArt())
      : (() => {
          this.game._subscribeCellToFrameRegister(done =>
            this._applyRules(done)
          );
          this.subscribedToRegister = true;
        })());

  return false;
};

// prettier-ignore
Cell.prototype._absorbLifeForce = function(life_force) {
  this.living
    ? this.bioMode ? this.newArt.push(life_force) : this.livingNeighbors++
    : this.bioMode ? this.dna.push(life_force) : this.livingNeighbors++;

  !this.subscribedToRegister && (() => {
    this.game._subscribeCellToFrameRegister(done => this._applyRules(done));
    this.subscribedToRegister = true;
  })()
};

// prettier-ignore
Cell.prototype._applyRules = function(done) {
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
    //   console.log(this.dna.join('•') + ' - ' + [ ...this.newArt, ...this.art ].join(''))
    this.dna = [];
  })()
  
  this.living = livingNext;
  this.subscribedToRegister = false;
  this.bioMode
    ? (this.newArt = [])
    : (this.livingNeighbors = 0);
  return done(this.coordinates, livingNext);
}

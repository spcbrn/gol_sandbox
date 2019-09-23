function GameCore() {}
GameCore.prototype._populateGameGrid = function() {
  this.gridBinary = this.gridBinary
    ? this.gridBinary
    : this._generateNewBinaryGrid();

  this.grid = this.gridBinary.map((row, y) =>
    row.map(
      (state, x) =>
        new Cell({
          x,
          y,
          living: state,
          bio_mode: this.bioMode || false,
          game: this
        })
    )
  );
};
GameCore.prototype._generateNewBinaryGrid = function() {
  const newGrid = new Array(this.height).fill(new Array(this.width).fill(0));
  return this.useRandomGrid ? this._randomizeGameGrid(newGrid) : newGrid;
};
GameCore.prototype._randomizeGameGrid = grid => {
  for (let row in grid)
    grid[row] = grid[row].map(c => (Math.random() > 0.936 ? 1 : 0));
  return grid;
};

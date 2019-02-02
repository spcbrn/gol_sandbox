class GameCore {
    constructor() {
        this.instId = (Math.random() * 1000).toString();
    }
}

GameCore.prototype._populateGameGrid = function() {
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
            bio_mode: this.bioMode || false,
            game: this
          })
      )
    );
};

GameCore.prototype._generateNewBinaryGrid = function({ width, height, random }) {
    const newGrid = new Array(height).fill(new Array(width).fill(0));
    return random ? this._randomizeGameGrid(newGrid) : newGrid;
};

GameCore.prototype._randomizeGameGrid = grid => {
  for (let row in grid)
    grid[row] = grid[row].map(c => (Math.random() > 0.936 ? 1 : 0));
  return grid;
};
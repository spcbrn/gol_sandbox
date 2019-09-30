class GameOfLifeClassic extends GameCore {
  constructor({ width, height, render, use_raf, seed_frame, random }) {
    super();

    this.width = width || 50;
    this.height = height || 50;

    this.grid = null;
    this.gridBinary = null;
    this.useRandomGrid = random || false;

    seed_frame instanceof Array &&
      seed_frame[0] instanceof Array &&
      typeof seed_frame[0][0] === 'number' &&
      (() => {
        this.gridBinary = seed_frame;
        this.height = seed_frame.length;
        this.width = seed_frame[0].length;
      })();

    this.interval = null;
    this._to = null;
    this.framesElapsed = 0;
    this.useRequestAnimationFrame = use_raf || true;
    this.render = ts => render(this.gridBinary, this.framesElapsed, ts);

    this._populateGameGrid(true);
  }
}

GameOfLifeClassic.prototype._generateCoordArray = function(width, height) {};

const dState = '·';
const lState = '•';

const getGridCoordinateArray = (grid_width, grid_height) =>
  new Array(grid_width)
    .fill(new Array(grid_height).fill(0))
    .map((row, y) => row.map((cell, x) => [x, y]))
    .reduce((acc, row) => acc.concat(row));

const getCellNeighborCoordinatesArray = (
  grid_width,
  grid_height,
  include_cell_coordinates
) => {
  const modifiers = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1]
  ];
  const neighborCoordinatesArray = [];
  for (let y = 0; y < grid_height; y++)
    for (let x = 0; x < grid_width; x++)
      neighborCoordinatesArray.push([
        ...(include_cell_coordinates ? [[x, y]] : []),
        ...(() => {
          const nCoords = modifiers
            .map(mod => {
              const xmod = x + mod[0];
              const ymod = y + mod[1];
              return xmod >= 0 &&
                xmod < grid_width &&
                ymod >= 0 &&
                ymod < grid_height
                ? [xmod, ymod]
                : null;
            })
            .filter(coord => coord !== null);
          return include_cell_coordinates ? [nCoords] : nCoords;
        })()
      ]);
  return neighborCoordinatesArray;
};

const getLivingNeighborCount = ({ cell_neighbors, grid }) => {
  let living_neighbors = 0;
  cell_neighbors.forEach(neighbor =>
    grid[neighbor[1]][neighbor[0]] === lState ? living_neighbors++ : null
  );
  return living_neighbors;
};

// prettier-ignore
const applyRulesToCell = ({ cell_state, living_neighbors }) =>
  cell_state === lState
    ? living_neighbors <= 1 || living_neighbors >= 4 ? dState : lState
    : living_neighbors === 3 ? lState : dState;

const computeNextFrame = ({ coordinate_array, current_grid_frame }) => {
  const nextFrame = [...current_grid_frame].map(row => [...row].fill(0));

  coordinate_array.forEach(cell => {
    const cellX = cell[0][0];
    const cellY = cell[0][1];
    const cellState = current_grid_frame[cellY][cellX];

    nextFrame[cellY][cellX] = applyRulesToCell({
      cell_state: cellState,
      living_neighbors: getLivingNeighborCount({
        cell_neighbors: cell[1],
        grid: current_grid_frame
      })
    });
  });

  return nextFrame;
};

const grid1 = randomlyPopulateGameGrid(generateBlankGameGrid(12, 12));
const grid1Coords = getGridCoordinateArray(8, 8);
const grid1CoordsWithNeighbors = getCellNeighborCoordinatesArray(10, 10, true);

window.stripGridArrayForRender = grid =>
  JSON.stringify(grid)
    .replace(/(\],)/g, '<br>')
    .replace(/(\[|\])/g, '')
    .replace(/,/g, '&nbsp;&nbsp;')
    .replace(/"/g, ' ');
// .replace(/0/g, '.')
// .replace(/1/g, "•");

const generateFrames = ({ frames, seed_grid, coordinate_array }) => {
  const frameArray = [];
  let current_grid_frame = seed_grid;
  for (let f = 0; f < frames; f++) {
    frameArray.push(current_grid_frame);
    const nextFrame = computeNextFrame({
      coordinate_array,
      current_grid_frame
    });
    current_grid_frame = nextFrame;
  }

  return frameArray;
};

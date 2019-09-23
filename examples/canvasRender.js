const canvas = document.getElementById('gCanvas');
const ctx = canvas.getContext('2d');
ctx.font = '24px serif';

const gridWidth = 120;
const gridHeight = 120;
const cellWidth = canvas.width / gridWidth;
const cellHeight = canvas.height / gridHeight;

const drawGrid = grid =>
  grid.forEach((row, y) =>
    row.forEach((cell, x) => {
      ctx.fillStyle = cell === 1 ? '#222222' : '#FFFFFF';
      ctx.fillRect(
        x * cellWidth + 1,
        y * cellHeight + 1,
        cellWidth - 2,
        cellHeight - 2
      );
    })
  );

const drawText = elapsed => {
  ctx.fillStyle = '#000000';
  ctx.fillText(
    `generations: ${elapsed}   fps: ${
      timeElapsed >= 2 ? Math.floor((elapsed * 10) / timeElapsed) : '--'
    }`,
    12,
    canvas.height - 12
  );
};

const drawRender = (grid_binary, frames_elapsed) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid(grid_binary);
  drawText(frames_elapsed);
};

golCanvas = new GameOfLife({
  width: gridWidth,
  height: gridHeight,
  render: drawRender,
  useRAF: true,
  random: true,
  bio_mode: true
});
golCanvas.initializeGame(108);
startTimer();

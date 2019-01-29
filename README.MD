# Conway's Game of Life - v2

Rather than running nested loops that compute the entire game matrix each frame, allow only the living and potentially living cells to handle their computation, while the rest undergo no change or computation.

 ## The LifeEngine is a class with:

 ### A central pulse which:
  - Sets/maintains the frame rate.
  - Dispatches game events to subscribing cells.
  - Invokes a render callback at the end of each frame.

 ### A matrix of cell functions which:
  - Live, die and share resources with one another.
  - Subscribe to frame events, when it is relevant to do so.
  - Compute and set their own living/dead states, when it is relevant to do so.

 ### A cell duty cycle which, for each frame of the game:
  - At the end of a frame, accumulates callback references for cells who will be living during the next frame.
  - When the next frame starts, proceeds through and invokes each living cell's callback, allowing it to distribute life force to each of it's neighbors.
  - Clears the duty cycle for the next frame's subscriptions.

 ### A frame register which, for each frame of the game:
  - Accumulates callback references from cells who will need to have the game rules applied.
  - Proceeds through the regiester at the end of each frame invoking each subscribed cell's callback, applying the game rules and setting the next state.
  - Clears the register for the next frame.

 ### A prototype object with:
  - A method to set the pulse interval and start the game lifecycle.
  - A method to generate a new game grid, 
    constructing cells and storing them in a matrix.
  - A method to receive a cell key and subscribe it to the frame register.
  - A method to call _applyRules on each cell key in the register,
    invoking a callback after the last.
  - A method to receive a cell key and add it to the duty cycle.
  - A method to receive a cell key and remove it from the duty cycle,
    invoking a callback after the final key has been removed.

## Each cell is a function with:
 ### A coordinate, a living/dead state.
 ### It's neighbor's coordinates (calculated and stored on first living frame).
 ### A prototype object with:
  - A method to calculate and store it's neighbor's coordinates.
  - A method to produce new life force and push one to each neighbor.
  - A method that acknowledges reception of life force and subscribes to the time   register.
  - A method that self-applies the rules of life and sets the cell's next state.

"At the end of each frame, father time will trigger an accounting of one's cellitude, living or dead, killing those who have aquired too much and raising those with the proper balance from the dead.
Of course all cellitude dissipates forever at the end of each frame, waiting to be remade by the living."
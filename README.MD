# Conway's Game of Life - v2

Rather than running nested loops that compute the entire game matrix each frame, allow only the living and potentially living cells to handle their computation, while the rest undergo no change or computation.

 ## The GameOfLife is a class with:

 ### A central pulse which:
  - Sets/maintains the frame rate.
  - Dispatches game events to subscribing cells.
  - Invokes a render callback at the end of each frame.

 ### A matrix of cell functions which:
  - Live, die and share resources with one another.
  - Distribute life force to their neighbor cells, when living.
  - Subscribe to frame events, when it is relevant to do so.
  - Compute and set their own living/dead states, when it is relevant to do so.

 ### A cell duty cycle which, for each frame of the game:
  - At the end of a frame, accumulates callback references for cells who will be living during the next frame.
  - When the next frame starts, proceeds through and invokes each callback, triggering life force distribution.
  - Clears the duty cycle for the next frame's subscriptions.

 ### A frame register which, for each frame of the game:
  - Accumulates callback references from cells who will need to have the game rules applied.
  - Proceeds through the regiester at the end of each frame invoking each callback, triggering the application of game rules to those cells.
  - Clears the register for the next frame.

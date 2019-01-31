(() => {
    let timeElapsed = 0;
    const startTimer = () => window.setInterval(() => (timeElapsed++), 100);
    class GameOfLife {
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
    };
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
            grid[row] = grid[row].map(c => (Math.random() > 0.936 ? 1 : 0));
        return grid;
    };
    GameOfLife.prototype._subscribeCellToDutyCycle = function(callback) {
    this.dutyCycle.push(callback);
    };
    GameOfLife.prototype._dispatchRunDutyCycle = function() {
        this.dutyCycle = this.dutyCycle.filter(distributeLifeForce =>
            typeof distributeLifeForce === "function"
            ? (() => {
                distributeLifeForce();
                return false;
            })()
            : false
        );
    };
    GameOfLife.prototype._subscribeCellToFrameRegister = function(callback) {
        this.frameRegister.push(callback);
    };
    GameOfLife.prototype._dispatchApplyRulesToRegister = function() {
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
    function Cell({ x, y, living, bio_mode, game }) {
        this.game = game;
    
        this.coordinates = [x, y];
        this.x = x;
        this.y = y;
        this.key = `${x}.${y}`;
    
        this.nCoords = [];
    
        this.living = living;
        this.bioMode = bio_mode;
    
        this.bioMode
        ? (() => {
            this.dna = [];
            this.art = [];
            this.newArt = [];
        })()
        : this.livingNeighbors = 0;
    
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
                (this.dna = [this._produceDNA(), this._produceDNA(), this._produceDNA()]);
            })();
    };
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
    Cell.prototype.nModifiers = [
        [-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]
    ];
    Cell.prototype._produceDNA = function() {
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
        !this.nCoords.length &&
            (this.nCoords = this._getNeighborCoordinates());

        let nLiving = 0;
        this.nCoords.forEach(n => {
            if (n === null) return;
            const neighbor = this.game.grid[n[1]][n[0]];
            neighbor._living()
            ? (() => {
                neighbor._absorbLifeForce(this.bioMode && this._produceArt());
                nLiving++;
                })()
            : neighbor._absorbLifeForce(this.bioMode && this._produceDNA());
        });

        !nLiving &&
            (this.bioMode
            ? this._absorbLifeForce(this._produceArt())
            : (() => {
                this.game._subscribeCellToFrameRegister(
                    done => this._applyRules(done)
                );
                this.subscribedToRegister = true;
                })());

        return false;
    };
    Cell.prototype._absorbLifeForce = function (life_force) {
        this.living
            ? this.bioMode ? this.newArt.push(life_force) : this.livingNeighbors++
            : this.bioMode ? this.dna.push(life_force) : this.livingNeighbors++;

        !this.subscribedToRegister && (() => {
            this.game._subscribeCellToFrameRegister(done => this._applyRules(done));
            this.subscribedToRegister = true;
        })()
    };
    Cell.prototype._applyRules = function (done) {
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
            // console.log(this.dna.join('•') + ' - ' + [ ...this.newArt, ...this.art ].join(''))
            this.dna = [];
        })()

        this.living = livingNext;
        this.subscribedToRegister = false;
        this.bioMode
            ? (this.newArt = [])
            : (this.livingNeighbors = 0);
        return done(this.coordinates, livingNext);
    }
    
    const domRoot = document.createElement('div');
    domRoot.setAttribute('id', 'dom_root');
    domRoot.setAttribute('style', `
        width:0px;
        height:0px;
        position:relative;
        z-index:1111;
    `);
    const canvasRoot = document.createElement('canvas');
    canvasRoot.setAttribute('id', 'c_root');
    canvasRoot.setAttribute('width', '512px');
    canvasRoot.setAttribute('height', '512px');
    canvasRoot.setAttribute('style', `
        position:absolute;
        left:calc(50vw - 256px);
        top:calc(50vh - 256px);
        background:#F5F5F5;
    `)
    document.body.prepend(domRoot);
    domRoot.appendChild(canvasRoot)

    const canvas = document.getElementById('c_root');
    const ctx = canvas.getContext('2d');
    ctx.font = '24px serif';

    const gridWidth = 96;
    const gridHeight = 96;
    const cellWidth = canvas.width / gridWidth;
    const cellHeight = canvas.height / gridHeight;

    const drawRender = (grid_binary, frames_elapsed) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(grid_binary);
        drawText(frames_elapsed);
    }
    const drawGrid = grid => grid.forEach((row, y) =>
        row.forEach((cell, x) => {
            ctx.fillStyle = cell === 1 ? '#222222' : '#FFFFFF';
            ctx.fillRect(
                (x * cellWidth),
                (y * cellHeight),
                cellWidth - 1,
                cellHeight - 1
            );
        })
    )
    const drawText = elapsed => {
        ctx.fillStyle = '#000000';
        ctx.fillText(
            `generations: ${elapsed}   fps: ${timeElapsed >= 2 ? Math.floor((elapsed * 10) / timeElapsed) : '--'}`,
                12,
                canvas.height - 12
        );
    }

    const golCanvas = new GameOfLife({
        width: gridWidth,
        height: gridHeight,
        render: drawRender,
        useRAF: true,
        random: true
    })
    golCanvas._initializeGame(93);
    startTimer();
})()
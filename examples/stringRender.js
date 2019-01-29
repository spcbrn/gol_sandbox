const root = document.getElementById('gol_root');
const drawBinaryFrameString = (grid_binary, frames_elapsed) => {
    root.innerHTML = `
        <div style="">
            ${JSON.stringify(grid_binary)
                .replace(/(\],)/g, "<br>")
                .replace(/(\[|\])|(,|")/g, "")
                .replace(/0/g, "🔘")
                .replace(/1/g, "🔵")}
        </div><br>
        <b>
            generations: ${frames_elapsed}&nbsp;&nbsp;
            fps: ${timeElapsed > 2 ? Math.floor((frames_elapsed * 10) / timeElapsed) : '...'}
        </b>
    `;
};

const golString = new GameOfLife({
    width: 120,
    height: 120,
    render: drawBinaryFrameString,
    useRAF: true,
    bio_mode: false,
    random: false,
    seed_frame: gliderGun.reverse()
})

golString._initializeGame(90);
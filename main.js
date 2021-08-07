function init() {
    window.numCols = 100
    window.cellSize = 10
    window.canvas = document.getElementById('game')
    window.ctx = canvas.getContext('2d')
    window.states = Array(100*100).fill(true, 0, window.numCols*window.numCols)
    //window.started = false

    document.addEventListener("click", (e) => {
        var [x, y] = getMousePosition(window.canvas, e)

        // Flip relevant cell
        var intX = Math.floor(x / window.cellSize)
        var intY = Math.floor(y / window.cellSize)
        window.states[intX*window.numCols+intY] = !(window.states[intX*window.numCols+intY])
        //window.started = true
    })
}

function draw() {

    var ctx = window.ctx
    ctx.fillStyle = 'rgb(0, 0, 0)'
    //ctx.fillRect(10, 10, 50, 50)

    for(let x = 0; x < window.numCols; x++) {
        for(let y = 0; y < window.numCols; y++) {
            if(window.states[x*window.numCols+y]) {
                ctx.fillStyle = 'rgb(0, 0, 0)'
            }
            else {
                ctx.fillStyle = 'rgb(255, 255, 255)'
            }
            ctx.fillRect(x*window.cellSize, y*window.cellSize, window.cellSize, window.cellSize)
        }
    }
}

function getMousePosition(canvas, event) {
    let rect = canvas.getBoundingClientRect()
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top
    return [x, y]
}

  
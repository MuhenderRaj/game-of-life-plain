function init() {
    window.numCols = 100
    window.cellSize = 10
    window.canvas = document.getElementById('game')
    window.ctx = canvas.getContext('2d')
    window.states = Array(100*100).fill(true, 0, window.numCols*window.numCols)
    window.timeInt = document.getElementById("time-interval")

    //window.started = false
    window.pausedElem = document.getElementById("paused")

    window.canvas.addEventListener("click", (e) => {
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

    if(!pausedElem.checked) {
        // Game of life logic
        var newStates = []
        
        for(let i = 0; i < window.numCols; i++) {
            for(let j = 0; j < window.numCols; j++) {
                let aliveNeighbors = 0
                for(let x = -1; x <= 1; x++) {
                    for(let y = -1; y <= 1; y++) {
                        if(x === 0 && y === 0) {
                            continue
                        }
                        
                        if(cellIsAlive(window.states, i+x, j+y)) {
                            aliveNeighbors++
                        }
                    }
                }

                if(states[i*window.numCols+j] === true) {
                    if(aliveNeighbors < 2) {
                        newStates.push(false)  // underpopulation
                    }
                    else if(aliveNeighbors < 4) {
                        newStates.push(true)
                    }
                    else {
                        newStates.push(false)  // overpopulation
                    }
                }
                else {
                    if (aliveNeighbors === 3) {
                        newStates.push(true)   // reproduction
                    }
                    else {
                        newStates.push(false)
                    }
                }
            }
        }

        window.states = newStates
    }
    
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

    setTimeout(draw, window.timeInt.value)
}

function getMousePosition(canvas, event) {
    let rect = canvas.getBoundingClientRect()
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top
    return [x, y]
}

function cellIsAlive(states, x, y) {
    let side = window.numCols
    if(x < 0 || x >= side || y < 0 || y >= side) {
        return false
    }

    return states[x*side+y]
}
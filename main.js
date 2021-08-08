function init() {
    window.numCols = 100
    window.cellSize = 10
    window.canvas = document.getElementById('game')
    window.ctx = canvas.getContext('2d')
    window.states = Array(100*100).fill(false, 0, window.numCols*window.numCols)
    window.speed = document.getElementById("speed")
    window.gridShown = document.getElementById("grid-show")

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
    ctx.fillStyle = 'rgb(255, 255, 255)'
    ctx.fillRect(0, 0, 1000, 1000)

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
                ctx.fillRect(x*window.cellSize, y*window.cellSize, window.cellSize, window.cellSize)
            }
            else if (window.gridShown.checked) {
                //ctx.fillStyle = 'rgb(255, 255, 255)'
                ctx.strokeStyle = 'rgb(180, 180, 180)'
                ctx.lineWidth = 0.5
                ctx.strokeRect(x*window.cellSize, y*window.cellSize, window.cellSize, window.cellSize)
            }
        }
    }

    setTimeout(draw, Math.floor(1000 / window.speed.value))
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

function saveState() {
    localStorage.setItem("state", JSON.stringify(window.states))
}

function loadState() {
    window.states = JSON.parse(localStorage.getItem("state"))
}
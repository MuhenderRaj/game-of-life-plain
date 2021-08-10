function init() {
    window.numCols = 100
    window.cellSize = 10
    window.canvas = document.getElementById('game')
    window.ctx = canvas.getContext('2d')
    window.states = new Array(window.numCols*window.numCols).fill(false, 0, window.numCols*window.numCols)
    window.speed = document.getElementById("speed")
    window.gridShown = document.getElementById("grid-show")
    window.pausedElem = document.getElementById("paused")
    window.rightSelectOn = false
    window.selectCoords = {
        startX: NaN,
        startY: NaN,
        endX: NaN,
        endY: NaN
    }
    window.copiedCoords = {
        startX: NaN,
        startY: NaN,
        endX: NaN,
        endY: NaN
    }
    window.mousePos = {
        x: NaN,
        y: NaN
    }

    // window.canvas.oncontextmenu = e => {
    //     e.preventDefault(); 
    //     //e.stopPropagation(); 
    // }

    //window.started = false

    window.canvas.addEventListener("mousemove", e => {
        var [x, y] = getMousePosition(e)
        window.mousePos = {x: x, y: y}
    })

    window.canvas.addEventListener("click", e => {
        var [x, y] = getMousePosition(e)
        var intX = Math.floor(x / window.cellSize)
        var intY = Math.floor(y / window.cellSize)
        if(!e.shiftKey) { // normal click
            // Flip relevant cell
            window.states[intX*window.numCols+intY] = !(window.states[intX*window.numCols+intY])
            //window.started = true
        }
        else { // select click
            if(!window.rightSelectOn) { // First endpoint of rect
                window.rightSelectOn = true
                window.selectCoords.startX = x
                window.selectCoords.startY = y
                window.selectCoords.endX = NaN
                window.selectCoords.endY = NaN
            }
            else { // Second endpoint of rect
                window.selectCoords.endX = x
                window.selectCoords.endY = y    // TODO reset start coords to NaN by pressing some button or something
                window.rightSelectOn = false
            }
        }
    })

    draw();
}

function update() {
    if(!window.pausedElem.checked) {
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
}

function copySelection() {
    // TODO write implementation
    throw "Not implemented"
    // Note: have to copy entire selection to a variable like an object with an array and dimensions or something, because copy and paste regions may overlap

    // for(let i in window.selectCoords) { // TODO test if this works
    //     if(Number.isNaN(window.selectCoords[i])) {
    //         return
    //     }
    // }

    // window.copiedCoords = Object.assign({}, window.selectCoords)
}

function replaceWithSelection(posX, posY) {
    // TODO write implementation
    throw "Not implemented"
}

function draw() {

    // Draw background
    var ctx = window.ctx
    ctx.fillStyle = 'rgb(255, 255, 255)'
    ctx.fillRect(0, 0, 1000, 1000)

    // Apply game rules
    update()
    
    // Draw the grid
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

    // Draw the selection box
    if(! Number.isNaN(window.selectCoords.startX)) {
        ctx.fillStyle = 'rgba(0, 125, 0, 0.2)'
        if(Number.isNaN(window.selectCoords.endX)) {
            let width = window.mousePos.x - window.selectCoords.startX
            let height = window.mousePos.y - window.selectCoords.startY
            ctx.fillRect(window.selectCoords.startX, window.selectCoords.startY, width, height)
        }
        else {
            let width = window.selectCoords.endX - window.selectCoords.startX
            let height = window.selectCoords.endY - window.selectCoords.startY
            ctx.fillRect(window.selectCoords.startX, window.selectCoords.startY, width, height)
        }
    }

    // Call next iteration with a time gap
    setTimeout(draw, Math.floor(1000 / window.speed.value))
}

function getMousePosition(event) {
    let rect = window.canvas.getBoundingClientRect()
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

function clearGrid() {
    window.states = new Array(window.numCols*window.numCols).fill(false, 0, window.numCols*window.numCols)
}

function saveState() {
    let liveCells = []
    for(let i = 0; i < window.numCols * window.numCols; i++) {
        if(window.states[i]) {
            liveCells.push(i)
        }
    }

    localStorage.setItem("state", JSON.stringify(liveCells))
}

function loadState() {
    let liveCells = JSON.parse(localStorage.getItem("state"))

    clearGrid()

    for(let i of liveCells) {
        window.states[i] = true
    }
}
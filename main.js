import {presets} from './modules/presets.js';

///////////////////////////
/// Lifecycle functions ///
///////////////////////////

/**
 * Run once at the start of the program
 */
export function init() {
    // Global constants //
    window.NUM_COLS = 100
    window.g_cell_size = 10

    window.DISPLAY_COLS = 100
    window.g_topLeft = {
        x: 0,
        y: 0,
    }

    // HTML elements //
    window.g_canvas = document.getElementById('game')
    window.g_ctx = g_canvas.getContext('2d')
    window.g_speed = document.getElementById("speed")
    window.g_gridShown = document.getElementById("grid-show")
    window.g_pausedElem = document.getElementById("paused")
    window.g_selectPreset = document.getElementById("presets")
    
    // Related to selecting cells //
    window.isSelecting = false
    window.selectCells = {
        startX: NaN,
        startY: NaN,
        endX: NaN,
        endY: NaN
    }

    // Relating to copying cells //
    window.copiedArea = {
        aliveCells: [],  // list of alive cells considering first cell as element 0 and going on in column major order with width and height
        width: NaN,
        height: NaN
    }

    // Related to mouse position //
    window.mouseCoords = {
        x: NaN,
        y: NaN
    }
    window.mouseCell = {
        x: NaN,
        y: NaN
    }

    
    // add custom presets, if any
    let customPresets = JSON.parse(localStorage.getItem("customPresets"))
    if (customPresets != null) {
        window.presets = {...presets, ...customPresets}
    }
    else {
        // Default game of life presets to copy //
        window.presets = presets
    }
    
    // Mouse event listeners //
    g_canvas.addEventListener("mousemove", e => {
        var [x, y] = getmousePosition(e)
        window.mouseCoords = {x: x, y: y}
        var intX = Math.floor(x / g_cell_size)
        var intY = Math.floor(y / g_cell_size)
        
        window.mouseCell = {x: intX, y: intY}
    })
    
    g_canvas.addEventListener("click", e => {
        var [x, y] = getmousePosition(e)
        var intX = Math.floor(x / g_cell_size)
        var intY = Math.floor(y / g_cell_size)
        if(e.shiftKey) { // select click
            if(!window.isSelecting) { // First endpoint of rect
                window.isSelecting = true
                window.selectCells.startX = intX
                window.selectCells.startY = intY
                window.selectCells.endX = NaN
                window.selectCells.endY = NaN
            }
            else { // Second endpoint of rect
                window.selectCells.endX = intX
                window.selectCells.endY = intY    // TODO reset start coords to NaN by pressing some button or something
                window.isSelecting = false
            }
        }
        else { // normal click
            // Flip relevant cell
            let cellIndex = (intX + g_topLeft.x)*NUM_COLS+(intY + g_topLeft.y)
            window.states[cellIndex] = !(window.states[cellIndex])
            //window.started = true
        }
    })

    window.addEventListener('keydown', function(event) {
        if (event.ctrlKey) {
            if (event.key === 'c') {
                copySelection()
            }
            else if (event.key === 'v') {
                replaceWithSelection()
            }
        }
        else if (event.key === 'r') {
            rotateShape()
        }
        else if (event.key === 'c') {
            window.copiedArea = {
                aliveCells: [],
                width: NaN,
                height: NaN
            }
        }
        else if(event.key === 'ArrowRight') {
            // TODO
            g_topLeft.x += 1
        }
        else if(event.key === 'ArrowLeft') {
            // TODO
            g_topLeft.x -= 1
        }
        else if(event.key === 'ArrowUp') {
            // TODO
            g_topLeft.y -= 1
        }
        else if(event.key === 'ArrowDown') {
            // TODO
            g_topLeft.y += 1
        }
    });
    
    clearGrid()
    draw()
}

/**
 * The main update method of the program
 */
function update() {
    if(g_selectPreset.selectedIndex !== 0) {
        window.copiedArea = window.presets[g_selectPreset.options[g_selectPreset.selectedIndex].value]
        g_selectPreset.selectedIndex = 0 // TODO: This is a hacky fix to fix continuously reassigning
    }
    
    // If not paused
    if(!g_pausedElem.checked) {
        // Game of life logic
        var newStates = []
        for(let i = 0; i < NUM_COLS; i++) {
            for(let j = 0; j < NUM_COLS; j++) {
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

                if(states[i*NUM_COLS+j] === true) {
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
    
    // g_canvas.focus({preventScroll: true})
}

/**
 * Draw changes to the canvas periodically. Calls itself after a timeout
 */
function draw() {
    var el = document.createElement("div")
    el.setAttribute("class", "")
    // Draw background
    var ctx = g_ctx   // Convenience
    ctx.fillStyle = 'rgb(255, 255, 255)'
    ctx.fillRect(0, 0, 1000, 1000)
    
    // Apply game rules
    update()
    
    // Draw the grid
    for (let x = 0; x < DISPLAY_COLS; x++) {
        for (let y = 0; y < DISPLAY_COLS; y++) {
            if (window.states[(x + g_topLeft.x) * NUM_COLS + (y + g_topLeft.y)]) {
                ctx.fillStyle = 'rgb(0, 0, 0)'
                ctx.fillRect(x*g_cell_size, y*g_cell_size, g_cell_size, g_cell_size)
            }
            else if (g_gridShown.checked) {
                //ctx.fillStyle = 'rgb(255, 255, 255)'
                ctx.strokeStyle = 'rgb(180, 180, 180)'
                ctx.lineWidth = 0.5
                ctx.strokeRect(x*g_cell_size, y*g_cell_size, g_cell_size, g_cell_size)
            }
        }
    }
    
    // Draw the selection box
    if (! Number.isNaN(window.selectCells.startX)) {
        ctx.fillStyle = 'rgba(0, 125, 0, 0.2)'
        if (Number.isNaN(window.selectCells.endX)) {
            let width = window.mouseCoords.x - window.selectCells.startX*g_cell_size
            let height = window.mouseCoords.y - window.selectCells.startY*g_cell_size
            ctx.fillRect(window.selectCells.startX * g_cell_size, window.selectCells.startY * g_cell_size, width, height)
        }
        else {
            let width = (window.selectCells.endX - window.selectCells.startX)*g_cell_size
            let height = (window.selectCells.endY - window.selectCells.startY)*g_cell_size
            ctx.fillRect(window.selectCells.startX * g_cell_size, window.selectCells.startY * g_cell_size, width, height)
        }
    }
    
    // Grey-shade the box the mouse is on
    ctx.fillStyle = 'rgb(150, 150, 150)'
    ctx.fillRect(window.mouseCell.x * g_cell_size, window.mouseCell.y * g_cell_size, g_cell_size, g_cell_size)
    
    // Red-shade the box marked to be the paste location
    // if(! Number.isNaN(window.pasteCell.posX) && window.copiedArea.aliveCells.length !== 0) {
    //     ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
    //     //ctx.fillRect(window.pasteCell.posX * g_cell_size, window.pasteCell.posY * g_cell_size, g_cell_size, g_cell_size)
    //     for(let cell of window.copiedArea.aliveCells) {
    //         var xInd = window.pasteCell.posX + Math.floor(cell / window.copiedArea.height)
    //         var yInd = window.pasteCell.posY + cell % window.copiedArea.height
    //         ctx.fillRect(xInd*g_cell_size, yInd*g_cell_size, g_cell_size, g_cell_size)
    //     }
    // }

    // Red-shade the box marked to be the paste location
    if(window.copiedArea.aliveCells.length !== 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
        //ctx.fillRect(window.pasteCell.posX * g_cell_size, window.pasteCell.posY * g_cell_size, g_cell_size, g_cell_size)
        for(let cell of window.copiedArea.aliveCells) {
            var xInd = window.mouseCell.x + Math.floor(cell / window.copiedArea.height)
            var yInd = window.mouseCell.y + cell % window.copiedArea.height
            ctx.fillRect(xInd*g_cell_size, yInd*g_cell_size, g_cell_size, g_cell_size)
        }
    }
    
    // Call next iteration with a time gap
    setTimeout(draw, Math.floor(1000 / g_speed.value))
    //setTimeout(draw, 1)
}

/////////////////////////
/// Utility functions ///
/////////////////////////

/**
 * 
 * @param {Event} event 
 * @returns the coordinates of the mouse
 */
function getmousePosition(event) {
    let rect = g_canvas.getBoundingClientRect()
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top
    return [x, y]
}

/**
 * 
 * @param {Event} event 
 * @returns the cell the mouse is currently in
 */
function getMouseCell(event) {
    let [x, y] = getmousePosition(event)
    
    var intX = Math.floor(x / g_cell_size)
    var intY = Math.floor(y / g_cell_size)
    
    return [intX, intY]
}

/**
 * 
 * @param {boolean[]} states the array of cells to search in
 * @param {number} x the x value of the cell
 * @param {number} y the y value of the cell
 * @returns {boolean} whether the cell is alive and valid
 */
function cellIsAlive(states, x, y) {
    let side = NUM_COLS
    if(x < 0 || x >= side || y < 0 || y >= side) {
        return false
    }
    
    return states[x*side+y]
}

/**
 * Clears the grid, killing all the cells
 */
function clearGrid() {
    window.states = new Array(NUM_COLS*NUM_COLS).fill(false, 0, NUM_COLS*NUM_COLS)
}

/**
 * Copies the selected cells to the copiedArea variable
 */
function copySelection() {
    window.copiedArea.width = Math.abs(window.selectCells.startX - window.selectCells.endX)
    window.copiedArea.height = Math.abs(window.selectCells.startY - window.selectCells.endY)

    let startX = Math.min(window.selectCells.startX, window.selectCells.endX)
    let startY = Math.min(window.selectCells.startY, window.selectCells.endY)

    window.copiedArea.aliveCells = []
    for(let i = 0; i < window.copiedArea.width; i++) {
        for(let j = 0; j < window.copiedArea.height; j++) {
            if(window.states[(g_topLeft.x+startX+i) * NUM_COLS + (g_topLeft.y+startY+j)]) {
                window.copiedArea.aliveCells.push(i * window.copiedArea.height + j)
            }
        }
    }
}

/**
 * Replaces the cells starting at the mouse pointing cell with the cells in copiedArea
 * Doesn't do anything if there is no selection
 */
function replaceWithSelection() {
    if (window.copiedArea.aliveCells.length === 0) {
        return
    }

    for(let cell of window.copiedArea.aliveCells) {
        var xInd = g_topLeft.x + window.mouseCell.x + Math.floor(cell / window.copiedArea.height)
        var yInd = g_topLeft.y + window.mouseCell.y + cell % window.copiedArea.height
        window.states[xInd*NUM_COLS + yInd] = true
    }
}

/**
 * Saves the current grid to localStorage
 */
export function saveState() {
    let liveCells = []
    for(let i = 0; i < NUM_COLS * NUM_COLS; i++) {
        if(window.states[i]) {
            liveCells.push(i)
        }
    }

    localStorage.setItem("state", JSON.stringify(liveCells))
}

/**
 * Loads the saved localStorage list ot the grid
 */
export function loadState() {
    let liveCells = JSON.parse(localStorage.getItem("state"))

    clearGrid()

    for(let i of liveCells) {
        window.states[i] = true
    }
}

/**
 * Returns a new shape that is the original shape rotated 90 degrees anticlockwise
 * @param {{aliveCells: number[], height: number, width: number}} shape the shape to be rotated
 * @returns {{aliveCells: number[], height: number, width: number}} the anticlockwise rotated shape
 */
function rotate(shape) {
    //GosperGun_SouthEast: {
    //    aliveCells: (36)[4, 5, 13, 14, 94, 95, 96, 102, 106, 110, 116, 119, 125, 131, 138, 142, 148, 149, 150, 158, 182, 183, 184, 191, 192, 193, 199, 203, 216, 217, 221, 222, 308, 309, 317, 318],
    //    height: 9,
    //    width: 36,
    //}

    let newShape = {
        aliveCells: [],
        height: shape.width,
        width: shape.height,
    }

    for(let cell of shape.aliveCells) {
        var intX = Math.floor(cell / shape.height)
        var intY = cell % shape.height

        var newX = intY
        var newY = newShape.height - intX - 1

        newShape.aliveCells.push(newX * newShape.height + newY)
    }

    return newShape
}

export function rotateShape() {
    window.copiedArea = rotate(window.copiedArea)
}
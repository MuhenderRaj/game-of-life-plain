var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import presets from './modules/presets.json' assert { type: "json" };
const defaultCoordinates = {
    x: NaN,
    y: NaN,
};
const defaultBoundingBox = {
    startX: NaN,
    endX: NaN,
    startY: NaN,
    endY: NaN,
};
///////////////////////////
/// Lifecycle functions ///
///////////////////////////
/**
 * Run once at the start of the program
 */
export function init() {
    // Global constants //
    window.NUM_COLS = 1000;
    window.DISPLAY_COLS = 100;
    window.g_cell_size = 1000 / DISPLAY_COLS;
    window.g_topLeft = {
        x: 0,
        y: 0,
    };
    window.aliveCells = new Set();
    window.updated = new Set();
    // HTML elements //
    window.g_canvas = document.getElementById('game');
    window.g_ctx = g_canvas.getContext('2d');
    window.g_speed = document.getElementById("speed");
    window.g_gridShown = document.getElementById("grid-show");
    window.g_pausedElem = document.getElementById("paused");
    window.g_selectPreset = document.getElementById("presets");
    window.g_saveName = document.getElementById("save-name");
    // Related to selecting cells //
    window.isSelecting = false;
    window.selectCells = Object.assign({}, defaultBoundingBox);
    // Relating to copying cells //
    window.copiedArea = {
        aliveCells: [],
        width: NaN,
        height: NaN
    };
    // Related to mouse position //
    window.mouseCoords = Object.assign({}, defaultCoordinates);
    window.mouseCell = Object.assign({}, defaultCoordinates);
    // add custom presets, if any
    let customPresets = JSON.parse(localStorage.getItem("customPresets"));
    if (customPresets != null) {
        window.presets = Object.assign(Object.assign({}, presets), customPresets);
    }
    else {
        // Default game of life presets to copy //
        window.presets = presets;
    }
    // Mouse event listeners //
    g_canvas.addEventListener("mousemove", e => {
        var [x, y] = getmousePosition(e);
        window.mouseCoords = { x: x, y: y };
        var intX = Math.floor(x / g_cell_size);
        var intY = Math.floor(y / g_cell_size);
        window.mouseCell = { x: intX, y: intY };
    });
    g_canvas.addEventListener("click", e => {
        var [x, y] = getmousePosition(e);
        var intX = Math.floor(x / g_cell_size);
        var intY = Math.floor(y / g_cell_size);
        if (e.shiftKey) { // select click
            if (!window.isSelecting) { // First endpoint of rect
                window.isSelecting = true;
                window.selectCells.startX = intX;
                window.selectCells.startY = intY;
                window.selectCells.endX = NaN;
                window.selectCells.endY = NaN;
            }
            else { // Second endpoint of rect
                window.selectCells.endX = intX;
                window.selectCells.endY = intY; // TODO reset start coords to NaN by pressing some button or something
                window.isSelecting = false;
            }
        }
        else { // normal click
            // Flip relevant cell
            let cellIndex = (intX + g_topLeft.x) * NUM_COLS + (intY + g_topLeft.y);
            if (window.aliveCells.has(cellIndex)) {
                window.aliveCells.delete(cellIndex);
            }
            else {
                window.aliveCells.add(cellIndex);
            }
            window.updated.add(cellIndex);
            // window.states[cellIndex] = !(window.states[cellIndex])
            //window.started = true
        }
    });
    window.addEventListener('keydown', function (event) {
        if (event.ctrlKey) {
            switch (event.key) {
                case 'c':
                    copySelection();
                    break;
                case 'x':
                    copySelection();
                    clearSelection();
                    break;
                case 'v':
                    replaceWithSelection();
                    break;
                case 's':
                    event.preventDefault();
                    saveSelection();
                    break;
                case '+':
                    event.preventDefault();
                    if (DISPLAY_COLS > 0)
                        DISPLAY_COLS--;
                    g_cell_size = 1000 / DISPLAY_COLS;
                    break;
                case '-':
                    event.preventDefault();
                    if (DISPLAY_COLS < NUM_COLS)
                        DISPLAY_COLS++;
                    g_cell_size = 1000 / DISPLAY_COLS;
                    break;
            }
        }
        else {
            switch (event.key) {
                case 'r':
                    rotateShape();
                    break;
                case 'c':
                    window.copiedArea = {
                        aliveCells: [],
                        width: NaN,
                        height: NaN
                    };
                    window.selectCells = {
                        startX: NaN,
                        startY: NaN,
                        endX: NaN,
                        endY: NaN
                    };
                    window.isSelecting = false;
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    if (g_topLeft.x < NUM_COLS - DISPLAY_COLS)
                        g_topLeft.x++;
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    if (g_topLeft.x > 0)
                        g_topLeft.x--;
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    if (g_topLeft.y < NUM_COLS - DISPLAY_COLS)
                        g_topLeft.y++;
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    if (g_topLeft.y > 0)
                        g_topLeft.y--;
                    break;
            }
        }
    });
    clearGrid();
    draw();
}
/**
 * The main update method of the program
 */
function update() {
    if (g_selectPreset.selectedIndex !== 0) {
        window.copiedArea = window.presets[g_selectPreset.options[g_selectPreset.selectedIndex].value];
        g_selectPreset.selectedIndex = 0; // TODO: This is a hacky fix to fix continuously reassigning
    }
    // If not paused
    if (!g_pausedElem.checked) {
        // Game of life logic
        var newAliveCells = new Set();
        var toBeChecked = new Set();
        for (let cell of window.aliveCells) {
            let [x, y] = coordsFromIndex(cell);
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    toBeChecked.add(indexFromCoords(x + i, y + j));
                }
            }
        }
        for (let cell of toBeChecked) {
            let [i, j] = coordsFromIndex(cell);
            let aliveNeighbors = 0;
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    if (x === 0 && y === 0) {
                        continue;
                    }
                    if (cellIsAlive(i + x, j + y)) {
                        aliveNeighbors++;
                    }
                }
            }
            if (cellIsAlive(i, j)) {
                if (aliveNeighbors < 2) {
                    //newStates.push(false)  // underpopulation
                }
                else if (aliveNeighbors < 4) {
                    newAliveCells.add(cell);
                }
                else {
                    //newStates.push(false)  // overpopulation
                }
            }
            else {
                if (aliveNeighbors === 3) {
                    newAliveCells.add(cell); // reproduction
                }
                else {
                    //newStates.push(false)
                }
            }
        }
        window.aliveCells = newAliveCells;
    }
    // g_canvas.focus({preventScroll: true})
}
/**
 * Draw changes to the canvas periodically. Calls itself after a timeout
 */
function draw() {
    var el = document.createElement("div");
    el.setAttribute("class", "");
    // Draw background
    var ctx = g_ctx; // Convenience
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, 1000, 1000);
    // Apply game rules
    update();
    // Draw the grid
    for (let x = 0; x < DISPLAY_COLS; x++) {
        for (let y = 0; y < DISPLAY_COLS; y++) {
            if (cellIsAlive(x + g_topLeft.x, y + g_topLeft.y)) {
                ctx.fillStyle = 'rgb(0, 0, 0)';
                ctx.fillRect(x * g_cell_size, y * g_cell_size, g_cell_size, g_cell_size);
            }
            else if (g_gridShown.checked) {
                //ctx.fillStyle = 'rgb(255, 255, 255)'
                ctx.strokeStyle = 'rgb(180, 180, 180)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x * g_cell_size, y * g_cell_size, g_cell_size, g_cell_size);
            }
        }
    }
    // Draw the selection box
    if (!Number.isNaN(window.selectCells.startX)) {
        ctx.fillStyle = 'rgba(0, 125, 0, 0.2)';
        let x1, x2, y1, y2;
        [x2, y2] = [window.selectCells.startX, window.selectCells.startY];
        if (Number.isNaN(window.selectCells.endX)) {
            [x1, y1] = getMouseCell(window.mouseCoords);
        }
        else {
            [x1, y1] = [window.selectCells.endX, window.selectCells.endY];
        }
        let [x_min, y_min] = [Math.min(x1, x2), Math.min(y1, y2)];
        let [x_max, y_max] = [Math.max(x1, x2), Math.max(y1, y2)];
        ctx.fillRect(x_min * g_cell_size, y_min * g_cell_size, (x_max - x_min + 1) * g_cell_size, (y_max - y_min + 1) * g_cell_size);
    }
    // Grey-shade the box the mouse is on
    ctx.fillStyle = 'rgb(150, 150, 150)';
    ctx.fillRect(window.mouseCell.x * g_cell_size, window.mouseCell.y * g_cell_size, g_cell_size, g_cell_size);
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
    if (window.copiedArea.aliveCells.length !== 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        //ctx.fillRect(window.pasteCell.posX * g_cell_size, window.pasteCell.posY * g_cell_size, g_cell_size, g_cell_size)
        for (let cell of window.copiedArea.aliveCells) {
            var xInd = window.mouseCell.x + Math.floor(cell / window.copiedArea.height);
            var yInd = window.mouseCell.y + cell % window.copiedArea.height;
            ctx.fillRect(xInd * g_cell_size, yInd * g_cell_size, g_cell_size, g_cell_size);
        }
    }
    // Call next iteration with a time gap
    setTimeout(draw, Math.floor(1000 / +g_speed.value));
    //setTimeout(draw, 1)
}
/////////////////////////
/// Utility functions ///
/////////////////////////
/**
 *
 * @param {MouseEvent} event
 * @returns the coordinates of the mouse
 */
function getmousePosition(event) {
    let rect = g_canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    return [x, y];
}
/**
 *
 * @param {coordinates} mousePosition the raw coordinates of the mouse
 * @returns the cell the mouse is currently in
 */
function getMouseCell(mousePosition) {
    let { x, y } = mousePosition;
    var intX = Math.floor(x / g_cell_size);
    var intY = Math.floor(y / g_cell_size);
    return [intX, intY];
}
/**
 *
 * @param {number} x the x value of the cell
 * @param {number} y the y value of the cell
 * @returns {boolean} whether the cell is alive and valid
 */
function cellIsAlive(x, y) {
    let side = NUM_COLS;
    if (x < 0 || x >= side || y < 0 || y >= side) {
        return false;
    }
    return window.aliveCells.has(x * side + y);
}
/**
 * Clears the grid, killing all the cells
 */
export function clearGrid() {
    window.aliveCells = new Set();
}
/**
 *
 * @param {number} index the index of the cell in column major order
 * @returns the coordinates as a tuple
 */
function coordsFromIndex(index) {
    return [Math.floor(index / NUM_COLS), index % NUM_COLS];
}
/**
 *
 * @param {number} x the x coordinate of the cell
 * @param {number} y the y coordinate of the cell
 * @returns {number} the index of the cell
 */
function indexFromCoords(x, y) {
    return x * NUM_COLS + y;
}
/**
 * Copies the selected cells to the copiedArea variable
 */
function copySelection() {
    window.copiedArea.width = Math.abs(window.selectCells.startX - window.selectCells.endX) + 1;
    window.copiedArea.height = Math.abs(window.selectCells.startY - window.selectCells.endY) + 1;
    let startX = Math.min(window.selectCells.startX, window.selectCells.endX);
    let startY = Math.min(window.selectCells.startY, window.selectCells.endY);
    window.copiedArea.aliveCells = [];
    for (let i = 0; i < window.copiedArea.width; i++) {
        for (let j = 0; j < window.copiedArea.height; j++) {
            if (window.aliveCells.has(indexFromCoords(g_topLeft.x + startX + i, g_topLeft.y + startY + j))) {
                window.copiedArea.aliveCells.push(i * window.copiedArea.height + j);
            }
        }
    }
}
/**
 * Clears the selected cells that are alive
 */
function clearSelection() {
    window.copiedArea.width = Math.abs(window.selectCells.startX - window.selectCells.endX);
    window.copiedArea.height = Math.abs(window.selectCells.startY - window.selectCells.endY);
    let startX = Math.min(window.selectCells.startX, window.selectCells.endX);
    let startY = Math.min(window.selectCells.startY, window.selectCells.endY);
    for (let i = 0; i < window.copiedArea.width; i++) {
        for (let j = 0; j < window.copiedArea.height; j++) {
            if (window.aliveCells.has(indexFromCoords(g_topLeft.x + startX + i, g_topLeft.y + startY + j))) {
                window.aliveCells.delete(indexFromCoords(g_topLeft.x + startX + i, g_topLeft.y + startY + j));
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
        return;
    }
    for (let cell of window.copiedArea.aliveCells) {
        var xInd = g_topLeft.x + window.mouseCell.x + Math.floor(cell / window.copiedArea.height);
        var yInd = g_topLeft.y + window.mouseCell.y + cell % window.copiedArea.height;
        window.aliveCells.add(indexFromCoords(xInd, yInd));
    }
}
/**
 * Saves the current selected cells to localStorage with the name given in the dialog box
 */
function saveSelection() {
    // Add to localStorage
    let presets = JSON.parse(localStorage.getItem("customPresets"));
    let name = g_saveName.value;
    presets = Object.assign(Object.assign({}, presets), { [name]: window.copiedArea });
    localStorage.setItem("customPresets", JSON.stringify(presets));
    g_saveName.value = "";
    // Add to presets list
    let option = document.createElement("option");
    option.setAttribute("value", name);
    option.innerText = name;
    g_selectPreset.appendChild(option);
    // Add to internal object of presets
    window.presets = Object.assign(Object.assign({}, window.presets), { [name]: window.copiedArea });
}
/**
 * Saves the current grid to localStorage
 */
export function saveState() {
    // let liveCells = []
    // for(let i = 0; i < NUM_COLS * NUM_COLS; i++) {
    //     if(window.states[i]) {
    //         liveCells.push(i)
    //     }
    // }
    let liveCells = Array.from(window.aliveCells);
    localStorage.setItem("state", JSON.stringify(liveCells));
}
/**
 * Loads the saved localStorage list ot the grid
 */
export function loadState() {
    let liveCells = JSON.parse(localStorage.getItem("state"));
    // clearGrid()
    // for(let i of liveCells) {
    //     window.states[i] = true
    // }
    window.aliveCells = new Set(liveCells);
}
/**
 * Returns a new shape that is the original shape rotated 90 degrees anticlockwise
 * @param {lifeShape} shape the shape to be rotated
 * @returns {lifeShape} the anticlockwise rotated shape
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
    };
    for (let cell of shape.aliveCells) {
        var intX = Math.floor(cell / shape.height);
        var intY = cell % shape.height;
        var newX = intY;
        var newY = newShape.height - intX - 1;
        newShape.aliveCells.push(newX * newShape.height + newY);
    }
    return newShape;
}
export function rotateShape() {
    window.copiedArea = rotate(window.copiedArea);
}
export function savePresets() {
    let out = JSON.stringify(window.presets);
    var element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(out));
    element.setAttribute('download', "presets.json");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
export function uploadPresets() {
    return __awaiter(this, void 0, void 0, function* () {
        let fileElement = document.getElementById("presets-file");
        let presets = JSON.parse(yield fileElement.files[0].text());
        window.presets = presets;
        let options = [];
        let option = document.createElement("option");
        option.setAttribute("value", "none");
        option.setAttribute("selected", "selected");
        option.innerText = "none";
        options.push(option);
        for (let preset in presets) {
            let option = document.createElement("option");
            option.setAttribute("value", preset);
            option.innerText = preset;
            options.push(option);
        }
        g_selectPreset.replaceChildren(...options);
    });
}
//# sourceMappingURL=main.js.map
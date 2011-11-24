$(document).ready(function() {
    $("#canvas_button").click(runCode);


});

var color = ["#1E161E"];
var selectedColor = ["#00FF00","#00FF00","#00FF00","#00FF00","#00FF00"];
var medianColor = ["#FF0000", "#FFFF00","#00FFFF","#FF00FF","#0000FF"];
var inactive = ["#9D8F96"];
var victory = ["#FCD667"];

var WIDTH;
var HEIGHT;
var DELAY = 100;
var ctx;
var g_ElementCount = 126;
var g_Elements = [];
var g_SelectIndex = 100;
var g_Pivot = [];
var g_Bounds = [];
var text_stack = [];


var barHeightDouble;
var barWidth;
var spacing;
var elmWidth
var totalWidth;
var initX;


function State(start, end, depth, k) {
    this.start = start;
    this.end = end;
    this.depth = depth;
    this.k = k;
}

function calculate_layout() {
    elmWidth = Math.floor(WIDTH / g_Elements.length);
    totalWidth = elmWidth * g_Elements.length;
    //TODO: Error handle for too many/too few
    spacing = Math.floor(elmWidth/2);
    barWidth = elmWidth - spacing;
    initX = Math.floor((WIDTH - totalWidth) / 2);
    barHeightDouble = (HEIGHT * .2) / g_Elements.length;
}

function runCode() {
    ctx = $('#select_canvas')[0].getContext("2d");
    HEIGHT = $('#select_canvas')[0].height;
    WIDTH = $('#select_canvas')[0].width;

    g_Elements = [];
    
    var i;
    for (i = 1; i <= g_ElementCount; ++i) {
        g_Elements.push(i*3);
        //g_Elements.push(Math.floor(Math.random() * g_ElementCount * 4));
    }

    for(i = 0; i < g_ElementCount; ++i) {
        var rand = Math.floor(Math.random() * g_ElementCount);
        temp = g_Elements[rand];
        g_Elements[rand] = g_Elements[i];
        g_Elements[i] = temp;
    }

    calculate_layout();
    draw_initial();

    var initState = new State(0, g_ElementCount, 0, g_SelectIndex);

    setTimeout(function() { selectStart(initState);}, DELAY);
}

function selectStart(state) {
    setTimeout(function() { selectGroupOfFive(state, 0); }, DELAY);
}

function selectGroupOfFive(curState, iterNum) {
    var place = curState.start + iterNum * 5;
    if(place < curState.end - 4 || (iterNum === 0 && (curState.end - curState.start > 1))) {
        if(curState.depth === 0 && iterNum === 0) {
            colorInactive(curState.start, curState.end);
        }
        colorSelected(curState, iterNum);
    }
    else if((curState.end - curState.start) === 1) {
        if(g_Bounds.length === 0) {
            colorInactive(curState.start, curState.end);
            drawBar(curState.start, victory[0]);
            alert(g_Elements[curState.start]);
            return;
        }
        var poppedState = g_Bounds.pop();
        var pivot = curState.start;
        runPivot(poppedState, pivot);
    }
    else {
        g_Bounds.push(curState);
        var newK = curState.start + Math.floor((iterNum) / 2);
        var newState = new State(curState.start, 
                                 curState.start + iterNum, 
                                 curState.depth + 1,
                                 newK);
        setTimeout(function() { selectGroupOfFive(newState, 0)}, 1);
    }
}

function runPivot(curState, pivot) {
    var pivotPosition = curState.start;
    for(var i = curState.start; i < curState.end; i++) {
        if (g_Elements[pivot] >= g_Elements[i]) {
            pivotPosition++;
        }
    }

    pivotPosition--; // >= makes it include itself

    swapBars(pivot, pivotPosition);

    if (pivotPosition === curState.k) {
        var newState = new State(pivotPosition, 
                                 pivotPosition + 1, 
                                 curState.depth - 1,
                                 pivotPosition);
        setTimeout(function() { selectGroupOfFive(newState, 0); }, DELAY);
    }
    else if(curState.k < pivotPosition) {
        var isLessThan = true;
        setTimeout(function() { doPivot(curState, pivotPosition, 0, 0, 
                isLessThan); }, DELAY);
    }
    else if(curState.k > pivotPosition) {
        var isLessThan = false;
        setTimeout(function() { doPivot(curState, pivotPosition, 0, 0, 
                isLessThan); }, DELAY);
    }
}
function doPivot(state, pivotPosition, smallCount, bigCount, isLessThan){
    if (state.start + smallCount  === pivotPosition) {
        if(isLessThan) {
            var newState = new State(state.start,
                                     pivotPosition, 
                                     state.depth,
                                     state.k);
            setTimeout(function() { selectGroupOfFive(newState, 0); }, DELAY);
        }
        else {
            var newState = new State(pivotPosition + 1, 
                                     state.end, 
                                     state.depth,
                                     state.k);
            setTimeout(function() { selectGroupOfFive(newState, 0); }, DELAY);
        }
    }
    else {
        if(g_Elements[pivotPosition] < g_Elements[state.start+smallCount]) {
            while (g_Elements[pivotPosition] <= 
                    g_Elements[pivotPosition + bigCount]) {
                bigCount++;
            }
            swapBars(state.start + smallCount, pivotPosition + bigCount);
            setTimeout(function() { doPivot(state, pivotPosition, 
                    smallCount, bigCount+1, isLessThan)}, DELAY);
        }
        else {
            setTimeout(function() { doPivot(state, pivotPosition,
                    smallCount+1, bigCount, isLessThan)}, DELAY);
        }
    }
}

function colorInactive(start, end) {
    for( var i = 0; i <= g_Elements.length; i++) {
        if(i < start || i >= end) {
            drawBar(i, inactive[0]);
        }
    }
}

function colorSelected(state, iterNum) {
    var selectStart = state.start + getSelectStartFromIterNum(iterNum);
    var i = selectStart;
    var selectEnd = (state.end - selectStart < 10) ?  state.end - 1 : selectStart + 4;
    for(;i <= selectEnd; i++) {
        clearBar(i);
        drawBar(i, selectedColor[state.depth]);
    }
    setTimeout(function() {findAndColorMedian(state, iterNum); }, DELAY);
}

function findAndColorMedian (state, iterNum) {

    var selectStart = state.start + getSelectStartFromIterNum(iterNum);
    var selectEnd = (state.end - selectStart < 10) ? 
            state.end - 1 : selectStart + 4;
    var k = Math.floor((selectEnd - selectStart) / 2) + selectStart;
    var med = findK(k, selectStart, selectEnd);

    clearBar(med);
    drawBar(med, medianColor[state.depth]);

    setTimeout(function() { revertSection(state, iterNum, med);}, DELAY);
}

function findK(k, start, end) {
    temp = [];
    var i;
    for( i = start; i <= end; i++) {
        temp.push(g_Elements[i]);
    }
    temp = temp.sort(function(a,b) {return (a-b);});
    for(i = start; i <= end; i++) {
        if (temp[k - start] === g_Elements[i]) {
            return i;
        }
    }
    return -1;
}

function revertSection(state, iterNum, med) {
    var selectStart = state.start + getSelectStartFromIterNum(iterNum);
    var i = selectStart;
    var selectEnd = (state.end - selectStart < 10) ?
            state.end - 1 : selectStart + 4;
    for(;i <= selectEnd; i++) {
        if(i !== med) {
            clearBar(i);
            if (state.depth === 0) {
                drawBar(i, color[0]);
            }
            else {
                drawBar(i, medianColor[state.depth - 1]);
            }
        }
    }

    setTimeout(function() { swapMedianToFront(state, iterNum, med);}, DELAY);
}

function swapMedianToFront(state, iterNum, med) {
    swapBars(state.start + iterNum, med);
    setTimeout(function() {selectGroupOfFive(state, iterNum+1);}, DELAY);
}


function getSelectStartFromIterNum(selectStart) {
    return selectStart * 5;
}

/* Canvas Utility Functions**/

function draw_initial() {
    clear();
    var i = 0;
    for (i = 0; i < g_Elements.length; ++i) {
        drawBar(i, color[0]);
    }
}

function swapBars(pos1, pos2) {
    var color1 = getBarColor(pos1);
    var color2 = getBarColor(pos2);
    clearBar(pos1);
    clearBar(pos2);

    var temp = g_Elements[pos1];
    g_Elements[pos1] = g_Elements[pos2]
    g_Elements[pos2] = temp;

    drawBar(pos1, color2);
    drawBar(pos2, color1);
}

function clear() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

function clearBar(pos) {
    var x = initX + (pos * (elmWidth));
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.rect(x, 0, barWidth, HEIGHT);
    ctx.closePath();
    ctx.fill();
}

function drawBar(pos, color) {
    var x = initX + (pos * (elmWidth));
    var height = Math.floor(g_Elements[pos] * barHeightDouble);
    var y = HEIGHT - height;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(x, y, barWidth, height);
    ctx.closePath();
    ctx.fill();
}

/* Coloring utility functions **/

function getBarColor(pos) {
    var x = initX + (pos * (elmWidth));
    var y = HEIGHT - 1;

    var pixel = ctx.getImageData(x, y, 1, 1).data;
    return getColorString(pixel);
}

function getColorString(pixel) {
    var color = "#";
    color += hexValueToString(Math.floor(pixel[0]/16));
    color += hexValueToString(pixel[0]%16);

    color += hexValueToString(Math.floor(pixel[1]/16));
    color += hexValueToString(pixel[1]%16);

    color += hexValueToString(Math.floor(pixel[2]/16));
    color += hexValueToString(pixel[2]%16);

    return color;
}

function hexValueToString(value) {
    switch (value) {
        case 0: return "0";
        case 1: return "1";
        case 2: return "2";
        case 3: return "3";
        case 4: return "4";
        case 5: return "5";
        case 6: return "6";
        case 7: return "7";
        case 8: return "8";
        case 9: return "9";
        case 10: return "A";
        case 11: return "B";
        case 12: return "C";
        case 13: return "D";
        case 14: return "E";
        case 15: return "F";
        default: return "-1"
    }
}

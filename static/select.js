
var INITIAL_DELAY = 100;

$(document).ready(function() {
    $("#run_reset_button").click(runCode);
    $("#pause_unpause_button").click(togglePause);
    $("#element_count").change(elementCountChanged);
    $("#delay_slider").change(delayChanged);
    $("#delay_slider").val(INITIAL_DELAY);
    $("#delay_slider").change();
    
    initialize();
});

var color = ["#1E161E"];
var selectedColor = ["#1B1BB3","#1B1BB3","#1B1BB3","#1B1BB3","#1B1BB3"];
var medianColor = ["#FF0000", "#FF7400","#009999","#00CC00","#FFFFFF"];
var inactive = ["#9D8F96"];
var victory = ["#FFBF00"];

var WIDTH;
var HEIGHT;
var ctx;
var g_delay = 50;
var g_ElementCount = 100;
var g_Elements = [];
var g_SelectIndex = 4;
var g_Pivot = [];
var g_Bounds = [];
var g_TextStack = [];
var g_initialized = false;

var barHeightDouble;
var barWidth;
var spacing;
var elmWidth;
var totalWidth;
var initX;


//Provide a hook into the set timeout process
function passToTimeout(fn, delay) {
    setTimeout(fn,delay); 
}

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
    barHeightDouble = (HEIGHT * .90) / g_Elements.length;
}

function initialize() {
    ctx = $('#select_canvas')[0].getContext("2d");
    HEIGHT = $('#select_canvas')[0].height;
    WIDTH = $('#select_canvas')[0].width;

    g_Elements = [];
    
    var i;
    for (i = 1; i <= g_ElementCount; ++i) {
        g_Elements.push(Math.ceil(Math.random() * g_ElementCount ));
    }

    for(i = 0; i < g_ElementCount; ++i) {
        var rand = Math.floor(Math.random() * g_ElementCount);
        temp = g_Elements[rand];
        g_Elements[rand] = g_Elements[i];
        g_Elements[i] = temp;
    }

    calculate_layout();
    drawInitial();
    g_initialized = true;
} 

function runCode() {
    console.log("runCode");
    if(g_initialized === false)
        return;

    
    
    var initState = new State(0, g_ElementCount, 0, g_SelectIndex);
    pushSearch(initState);
    passToTimeout(function() { selectStart(initState);}, g_delay);
}

function selectStart(state) {
    if((state.end - state.start) === 1) {
        if(g_Bounds.length === 0) {
            colorInactive(state.start, state.end);
            drawBar(state.start, victory[0]);
            return;
        }
        var poppedState = g_Bounds.pop();
        var pivot = state.start;
        passToTimeout(function() { runPivot(poppedState, pivot);}, 1);
    }
    else {
        if(state.depth === 0) {
            colorInactive(state.start, state.end);
        }
        pushMedianRange(state);
        passToTimeout(function() { selectGroupOfFive(state, 0); }, g_delay);
    }
}

function selectGroupOfFive(curState, iterNum) {
    var place = curState.start + iterNum * 5;
    if(place < curState.end - 4 || 
            (iterNum === 0 && (curState.end - curState.start > 1))) {
        colorSelected(curState, iterNum);
    }
    else {
        g_Bounds.push(curState);
        var newK = curState.start + Math.floor((iterNum - 1) / 2);
        var newState = new State(curState.start, 
                                 curState.start + iterNum, 
                                 curState.depth + 1,
                                 newK);
        pushSearch(newState);
        passToTimeout(function() { selectStart(newState)}, 1);
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
    pushPivot(pivotPosition);

    if (pivotPosition === curState.k) {
        //popTopText();
        var newState = new State(pivotPosition, 
                                 pivotPosition + 1, 
                                 curState.depth - 1,
                                 pivotPosition);
        passToTimeout(function() { selectStart(newState); }, g_delay);
    }
    else if(curState.k < pivotPosition) {
        var isLessThan = true;
        passToTimeout(function() { doPivot(curState, pivotPosition, 0, 0, 
                isLessThan); }, g_delay);
    }
    else if(curState.k > pivotPosition) {
        var isLessThan = false;
        passToTimeout(function() { doPivot(curState, pivotPosition, 0, 0, 
                isLessThan); }, g_delay);
    }
}
function doPivot(state, pivotPosition, smallCount, bigCount, isLessThan){
    if (state.start + smallCount  === pivotPosition) {
        if(isLessThan) {
            var newState = new State(state.start,
                                     pivotPosition, 
                                     state.depth,
                                     state.k);
            passToTimeout(function() { selectStart(newState); }, g_delay);
        }
        else {
            var newState = new State(pivotPosition + 1, 
                                     state.end, 
                                     state.depth,
                                     state.k);
            passToTimeout(function() { selectStart(newState); }, g_delay);
        }
    }
    else {
        if(g_Elements[pivotPosition] < g_Elements[state.start+smallCount]) {
            while (g_Elements[pivotPosition] <= 
                    g_Elements[pivotPosition + bigCount]) {
                bigCount++;
            }
            swapBars(state.start + smallCount, pivotPosition + bigCount);
            passToTimeout(function() { doPivot(state, pivotPosition, 
                    smallCount, bigCount+1, isLessThan)}, g_delay);
        }
        else {
            passToTimeout(function() { doPivot(state, pivotPosition,
                    smallCount+1, bigCount, isLessThan)}, g_delay);
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
    passToTimeout(function() {findAndColorMedian(state, iterNum); }, g_delay);
}

function findAndColorMedian (state, iterNum) {

    var selectStart = state.start + getSelectStartFromIterNum(iterNum);
    var selectEnd = (state.end - selectStart < 10) ? 
            state.end - 1 : selectStart + 4;
    var k = Math.floor((selectEnd - selectStart) / 2) + selectStart;
    var med = findK(k, selectStart, selectEnd);

    clearBar(med);
    drawBar(med, medianColor[state.depth]);

    passToTimeout(function() { revertSection(state, iterNum, med);}, g_delay);
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

    passToTimeout(function() { swapMedianToFront(state, iterNum, med);}, g_delay);
}

function swapMedianToFront(state, iterNum, med) {
    swapBars(state.start + iterNum, med);
    passToTimeout(function() {selectGroupOfFive(state, iterNum+1);}, g_delay);
}


function getSelectStartFromIterNum(selectStart) {
    return selectStart * 5;
}

/* Canvas Utility Functions**/

function drawInitial() {
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
        default: return "-1";
    }
}

function pushPivot(pivot) {
    g_TextStack.push("Pivoting on location " + pivot + ".");
    repaintTextStack();
}

function pushMedianRange(state) { //start, end) {
    var text = "Finding medians ";
    var depth = state.depth - 1;
    for(var i = 0; i < depth; i++)
        text += "of medians ";

    text += "in range: location " + state.start + " to location " + state.end;  
    g_TextStack.push(text);
    repaintTextStack();
}

function pushSearch(state) {
    var depth = state.depth;
    var k = state.k;
    if(depth === 0)
        g_TextStack.push("Searching for element in location " + k);
    else if (depth === 1)
        g_TextStack.push("Searching for median in location " + k);
    else {
        var text = "Searching for median "
        for(var i = 1; i < depth; i++)
            text += "of medians ";
        text += "in location " + k;
        g_TextStack.push(text);
    }
    repaintTextStack();
}

function popTopText() {
    g_TextStack.pop();
    console.log("poppin");
    repaintTextStack();
}

function repaintTextStack() {
    var ts = $('#text_stack')[0];
    var str = "";
    for(var i = 0; i < g_TextStack.length; i++) {
        str += g_TextStack[i] + "<br />";
    }
    console.log("painting");
    ts.innerHTML = str;
    //Resevered for element manipulation
}

function togglePause() {
    g_isPaused = !g_isPaused;
    if(g_isPaused)
        $("#pause_unpause_button").innerHTML="Unpause";
    else
        $("#pause_unpause_button").innerHTML="Pause";
}

function elementCountChanged() {

}

function delayChanged() {
    g_delay = $(this).val();//$("delay_slider").value;
    console.log(g_delay);
    $("#delay_display").html(g_delay);
}

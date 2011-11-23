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
var g_SelectIndex = 0;
var g_Pivot = [];
var g_Bounds = [];
var text_stack = [];


var barHeightDouble;
var barWidth;
var spacing;
var elmWidth
var totalWidth;
var initX;


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
    setTimeout(function() { selectStart(0 , g_ElementCount, 0, g_SelectIndex);},
            DELAY);
}

function selectStart(start, end, depth, k) {
    setTimeout(function() { selectGroupOfFive(start, end, 0, depth, 
            k); }, DELAY);
}

function selectGroupOfFive(start, end, iterNum, depth, k) {
    var place = start + iterNum * 5;
    if(place < end - 4 || (iterNum === 0 && (end - start > 1))) {
        if(depth === 0 && iterNum === 0) {
            colorInactive(start, end);
        }
        colorSelected(start, end, iterNum, depth, k);
    }
    else if((end - start) === 1) {
        if(g_Bounds.length === 0) {
            colorInactive(start, end);
            drawBar(start, victory[0]);
            alert(g_Elements[start]);
            return;
        }
        var b = g_Bounds.pop();
        var s = b[0];
        var e = b[1];
        var d = b[3];
        var pk = b[4];
        runPivot(start, s, e, d, pk);
    }
    else {
        g_Bounds.push([start, end, iterNum, depth, k]);
        var newK = start + Math.floor((iterNum) / 2);
        setTimeout(function() { selectGroupOfFive(start,start+iterNum, 0,
                   depth + 1, newK)}, 1);
    }
}

function runPivot(pivot, start, end, depth, k) {
    var position = start;
    for(var i = start; i < end; i++) {
        if (g_Elements[pivot] >= g_Elements[i]) {
            position++;
        }
    }

    position--; // >= makes it include itself

    swapBars(pivot, position);

    if (position === k) {
        setTimeout(function() { selectGroupOfFive(position, position + 1, 0,
                   depth - 1, 0)}, DELAY);
    }
    else if(k < position) {
        var isLessThan = true;
        setTimeout(function() { doPivot(position, start, end, 0,
                0, depth, k, isLessThan) }, DELAY);

    }
    else if(k > position) {
        var isLessThan = false;
        setTimeout(function() { doPivot(position, start, end, 0,
                0, depth, k, isLessThan) }, DELAY);
    }
}
function doPivot(position, start, end, smallCount, bigCount, depth, k,
        isLessThan){
    if (start + smallCount  === position) {
        if(isLessThan) {
            setTimeout(function() { selectGroupOfFive(start, position,
                    0, depth, k) }, DELAY);
        }
        else {
            setTimeout(function() { selectGroupOfFive(position + 1, end,
                    0, depth, k, isLessThan) }, DELAY);
        }
    }
    else {
        if(g_Elements[position] < g_Elements[start+smallCount]) {
            while (g_Elements[position] <= g_Elements[position + bigCount]) {
                bigCount++;
            }
            swapBars(start + smallCount, position + bigCount);
            setTimeout(function() { doPivot(position, start, end,
                    smallCount, bigCount+1, depth, k, isLessThan)}, DELAY);
        }
        else {
            setTimeout(function() { doPivot(position, start, end,
                    smallCount+1, bigCount, depth, k, isLessThan)}, DELAY);
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

function colorSelected(start, end, iterNum, depth, k) {
    var selectStart = start + getSelectStartFromIterNum(iterNum);
    var i = selectStart;
    var selectEnd = (end - selectStart < 10) ?  end - 1 : selectStart + 4;
    for(;i <= selectEnd; i++) {
        clearBar(i);
        drawBar(i, selectedColor[depth]);
    }
    setTimeout(function() {findAndColorMedian(start, end, iterNum,
                           depth, k) }, DELAY);
}

function findAndColorMedian (start, end, iterNum, depth, savedK) {

    var selectStart = start + getSelectStartFromIterNum(iterNum);
    var selectEnd = (end - selectStart < 10) ?  end - 1 : selectStart + 4;
    var k = Math.floor((selectEnd - selectStart) / 2) + selectStart;
    var med = findK(k, selectStart, selectEnd);

    clearBar(med);
    drawBar(med, medianColor[depth]);

    setTimeout(function() { revertSection(start, end, iterNum,
                            med, depth, savedK);}, DELAY);
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

function revertSection(start, end, iterNum, med, depth, k) {
    var selectStart = start + getSelectStartFromIterNum(iterNum);
    var i = selectStart;
    var selectEnd = (end - selectStart < 10) ?  end - 1 : selectStart + 4;
    for(;i <= selectEnd; i++) {
        if(i !== med) {
            clearBar(i);
            if (depth === 0) {
                drawBar(i, color[0]);
            }
            else {
                drawBar(i, medianColor[depth - 1]);
            }
        }
    }

    setTimeout(function() { swapMedianToFront(start, end, iterNum, med,
            depth, k);}, DELAY);
}

function swapMedianToFront(start, end, iterNum, med, depth, k) {
    swapBars(start + iterNum, med);
    setTimeout(function() {selectGroupOfFive(start, end, iterNum+1, depth, k);},
            DELAY);
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

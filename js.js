var gridSize = 10;
var gridWidth = 57; // 57
var gridHeight = 54; // 54
var mouseX = 0;
var mouseY = 0;
var target = undefined;
var placeBool = false;
var removeBool = false;
var debugBool = false;

$('#path').svg();
var svg = $('#path').svg('get');
var svgPath = svg.createPath();
var group = svg.group();

var pathWorker = new Worker('pathWorker.js');

function toggleDebug() {
    debugBool = !debugBool;
    $('.debugButton').text('Debug: ' + debugBool);
    if (!debugBool) {
        $('#debugger').empty();
    }
}

function findPath() {
    $('#passCounter').text('0/7');
    $('#timeCounter').text('0:00');
    $('.pather').prop('disabled', true).text('Working...');
    pathWorker.postMessage({
        gridSize: gridSize,
        obstacles: findObstacles(),
        max: {
            x: gridWidth,
            y: gridHeight
        }
    });

    pathWorker.addEventListener('message', function(e) {

        switch (e.data.type) {
            case 'pass':
                $('#passCounter').text(e.data.count + '/7');
                $('#timeCounter').text(millisToMinutesAndSeconds(e.data.time));
                break;
            case 'done':
                $('#debugger').empty();
                if (!e.data.isPossible) {
                    alert('Impossible Path');
                } else {
                    handlePath(e.data.paths);
                }
                $('.pather').prop('disabled', false).text('Path');
                break;
            case 'debug':
                $('#availableCounter').text(e.data.visited.length);
                if (debugBool) {
                    drawDebug(e.data);
                }
                break;
        }
    });
}

function drawDebug(data) {
    var visited = data.visited;
    var available = data.available;
    var layer = $('#debugger').empty();
    for (var i = 0; i < visited.length; i++) {
        layer.append(
            $('<div></div>')
                .css({'left': (visited[i].x * gridSize) + (gridSize * 0.25), 'top': (visited[i].y * gridSize) + (gridSize * 0.25)})
                .addClass('bug')
        );
    }
    for (var i = 0; i < available.length; i++) {
        layer.append(
            $('<div></div>')
                .css({'left': (available[i].x * gridSize) + (gridSize * 0.25), 'top': (available[i].y * gridSize) + (gridSize * 0.25)})
                .addClass('bug2')
        );
    }
}

function handlePath(paths) {
    svg.clear();
    var steps = 0;
    paths.forEach(function(p) {
        steps += p.length;
        drawTheWay(p);
    });
    $('#stepCounter').text(steps);
}

function drawTheWay(path) {

    svgPath.reset();
    group = svg.group();

    var pathSteps = [];

    for (var i = 0; i < path.length; i++) {
        pathSteps.push([(path[i].x * gridSize) - (gridSize / 2), (path[i].y * gridSize) - (gridSize / 2)]);
    }

    var travel = svgPath.move(pathSteps[0][0], pathSteps[0][1]).line(pathSteps);
    svg.path(group, travel, {fill: 'none', stroke: 'red', strokeWidth: 5, 'stroke-opacity': 0.4, 'stroke-linecap':'round'});
}

function findObstacles() {
    var obstacles = [];
    $('#grid').children('.placed-block').each(function(i, e) {
        var elem = $(e);
        var x = parseInt(elem.css('left').slice(0, -2));
        var y = parseInt(elem.css('top').slice(0, -2));
        obstacles.push({x: half(x, true), y: half(y, true)});
        obstacles.push({x: half(x + gridSize, true), y: half(y, true)});
        obstacles.push({x: half(x, true), y: half(y + gridSize, true)});
        obstacles.push({x: half(x + gridSize, true), y: half(y + gridSize, true)});
    });

    return obstacles;
}

function half(i, add) {
    if (add) {
        return i + (gridSize / 2);
    }
    return i - (gridSize / 2);
}

$(window).mousemove(function(e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
    target = e.target;
}).keydown(function(e) {
    if (e.key == 'e') {
        if (!placeBool) {
            quickPlace(Math.floor(mouseX / gridSize), Math.floor(mouseY / gridSize), null);
            placeBool = true;
        }
    } if (e.key == 'r') {
        if (!removeBool) {
            var div = $(target);
            if (div.hasClass('placed-block')) {
                div.remove();
                countWaves();
            }
            removeBool = true;
        }

    }
}).keyup(function(e) {
    if (e.key == 'e') {
        placeBool = false;
    } else if (e.key == 'r') {
        removeBool = false;
    }
});

creategrid(gridSize);

$('#saveText').val('');

$('.saver').click(function() {
    var field = $('#saveText');
    field.val('');
    var newVal = '';
    $('#grid').children('.placed-block').each(function(i, elem) {
        var e = $(elem);
        var x = e.css('left').slice(0, -2);
        var y = e.css('top').slice(0, -2);
        if (i > 0) {
            newVal += ';'
        }
        newVal += (x / gridSize) + ',' + (y / gridSize);
        if (e.hasClass('optional')) {
            newVal += ',o';
        }
    });
    field.val(newVal);
});

$('.loader').click(function() {
    var field = $('#saveText');
    var array = field.val().split(';');

    for (var i = 0; i < array.length; i++) {
        var coords = array[i].split(',');
        if (coords.length === 3) {
            quickPlace(coords[0], coords[1], 'optional');
        } else {
            quickPlace(coords[0], coords[1], null);
        }

    }
});

$('.draggable').draggable({
    grid: [ gridSize,gridSize ],
    revert: "invalid",
    stack: ".draggable",
    helper: 'clone'
});
$('#grid').droppable({
    accept: ".draggable",
    drop: function (event, ui) {
        if (!ui.draggable.hasClass('placed-block')) {
            quickPlace(ui.position.left / gridSize, ui.position.top / gridSize, null);
        }
    }
});

function countWaves() {
    var blocks = $('#grid').children('.placed-block');
    if (blocks.length > 0) {
        $('#waveCounter').text(Math.ceil(blocks.length / 5));
        $('#blockCounter').text(blocks.length);
    }

}

function hasBlock(x, y) {
    var found = false;

    $('#grid').children('.placed-block').each(function(i, elem) {
        var e = $(elem);
        var x1 = parseInt(e.css('left').slice(0, -2)) / gridSize;
        var x2 = x1 + 1;
        var y1 = parseInt(e.css('top').slice(0, -2)) / gridSize;
        var y2 = y1 + 1;

        if (((x === x1 || x === x2) && (y === y1 || y === y2)) ||
            ((x + 1 === x1 || x + 1 === x2) && (y + 1 === y1 || y + 1 === y2))) {
            found = true;
            return false;
        }
    });

    return found;
}

function quickPlace(x, y, optional) {

    if (!hasBlock(x, y)) {
        var canvas = $('#grid');
        var classes = 'placed-block draggable block';
        if (optional !== null) {
            classes += ' optional';
        }
        var elem = $('<div></div>').addClass(classes);
        elem.draggable({
            containment: '#grid',
            grid: [ gridSize,gridSize ]
        }).contextmenu(function(e) {
            e.preventDefault();
            $(this).toggleClass('optional');
        });
        elem.css({
            'left': (x * gridSize) + 'px',
            'top': (y * gridSize) + 'px',
            'position': 'absolute',
            'z-index': '12'
        });
        canvas.append(elem);

        countWaves();
    }
}

function creategrid(size){

    var standardW = Math.floor((gridWidth * gridSize) / size),
        standardH = Math.floor((gridHeight * gridSize) / size);

    var standard = document.getElementById('grid');
    standard.style.width = (standardW * size) + 'px';
    standard.style.height = (standardH * size) + 'px';

    for (var i = 0; i < standardH; i++) {
        for (var p = 0; p < standardW; p++) {
            var cell = document.createElement('div');
            cell.className = 'gridInner';
            cell.style.height = (size - 1) + 'px';
            cell.style.width = (size - 1) + 'px';
            cell.style.position = 'relative';
            cell.style.zIndex= '2';
            standard.appendChild(cell);
        }
    }

    document.body.appendChild(standard);
    $('#grid').append(placeMap());
}

function placeMap() {
    return $('<div></div>')
        .append(placeBlock(10, 6))
        .append(placeBlock(12, 6))
        .append(placeBlock(14, 6))
        .append(placeBlock(12, 8))

        .append(placeBlock(26, 6))
        .append(placeBlock(28, 6))
        .append(placeBlock(30, 6))
        .append(placeBlock(28, 8))

        .append(placeBlock(42, 6))
        .append(placeBlock(44, 4))
        .append(placeBlock(44, 6))
        .append(placeBlock(44, 8))

        .append(placeBlock(12, 28))
        .append(placeBlock(12, 30))
        .append(placeBlock(12, 32))
        .append(placeBlock(14, 30))

        .append(placeBlock(42, 30))
        .append(placeBlock(44, 30))
        .append(placeBlock(46, 30))
        .append(placeBlock(44, 28))

        .append(placeBlock(28, 44))
        .append(placeBlock(28, 46))
        .append(placeBlock(28, 48))
        .append(placeBlock(30, 46))

        .append(placeRoad(0, 10, 6, 'horizontal'))
        .append(placeRoad(32, 10, 6, 'horizontal'))
        .append(placeRoad(16, 26, 30, 'horizontal'))
        .append(placeRoad(32, 25, 46, 'horizontal'))

        .append(placeRoad(10, 18, 12, 'vertical'))
        .append(placeRoad(10, 18, 44, 'vertical'))
        .append(placeRoad(10, 34, 28, 'vertical'))
}

function placeBlock(x, y) {
    return $('<div></div>')
        .addClass('roadBlock')
        .css({
            'left': (gridSize * x) + 'px',
            'top': (gridSize * y) + 'px'
        });
}

function placeRoad(from, to, follow, direction) {
    var begin = gridSize * from;
    var end = (gridSize * to) - 1;
    var along = gridSize * follow;

    var css = {
        'left': begin + 'px',
        'width': end + 'px',
        'top': along + 'px'
    };

    if (direction === 'vertical') {
        css = {
            'top': begin + 'px',
            'height': end + 'px',
            'left': along + 'px'
        };
    }

    return $('<div></div>')
        .addClass('road ' + direction)
        .css(css);
}

function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}
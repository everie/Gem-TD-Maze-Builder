importScripts('underscore-min.js');

var visited = [];
var theWay = [];
var isPossible = true;

var obstacles = [];
var gridSize = undefined;

var maxX = 0;
var maxY = 0;

self.addEventListener('message', function(e) {
    gridSize = e.data.gridSize;
    obstacles = e.data.obstacles;

    maxX = e.data.max.x;
    maxY = e.data.max.y;

    findPath(e.data.passes);
}, false);

function findPath(checkPasses) {
    var paths = [];
    var passes = 0;
    var startTime = Date.now();

    if (checkPasses[0]) {
        findAWay(1, 7, 13, 7);
        paths.push(theWay);
        self.postMessage({
            type: 'pass',
            count: ++passes,
            visited: visited.length,
            time: Date.now() - startTime
        });
    }

    if (checkPasses[1]) {
        findAWay(13, 7, 13, 31);
        paths.push(theWay);
        self.postMessage({
            type: 'pass',
            count: ++passes,
            visited: visited.length,
            time: Date.now() - startTime
        });
    }

    if (checkPasses[2]) {
        findAWay(13, 31, 45, 31);
        paths.push(theWay);
        self.postMessage({
            type: 'pass',
            count: ++passes,
            visited: visited.length,
            time: Date.now() - startTime
        });
    }

    if (checkPasses[3]) {
        findAWay(45, 31, 45, 8);
        paths.push(theWay);
        self.postMessage({
            type: 'pass',
            count: ++passes,
            visited: visited.length,
            time: Date.now() - startTime
        });
    }

    if (checkPasses[4]) {
        findAWay(45, 8, 30, 8);
        paths.push(theWay);
        self.postMessage({
            type: 'pass',
            count: ++passes,
            visited: visited.length,
            time: Date.now() - startTime
        });
    }

    if (checkPasses[5]) {
        findAWay(30, 8, 30, 47);
        paths.push(theWay);
        self.postMessage({
            type: 'pass',
            count: ++passes,
            visited: visited.length,
            time: Date.now() - startTime
        });
    }

    if (checkPasses[6]) {
        findAWay(30, 47, 56, 47);
        paths.push(theWay);
        self.postMessage({
            type: 'pass',
            count: ++passes,
            visited: visited.length,
            time: Date.now() - startTime
        });
    }

    self.postMessage({
        type: 'done',
        paths: paths,
        isPossible: isPossible
    });
}

function half(i, add) {
    if (add) {
        return i + (gridSize / 2);
    }
    return i - (gridSize / 2);
}

function findAWay(startX, startY, endX, endY) {
    isPossible = true;
    var s = {
        x: startX,
        y: startY
    };

    var found = false;
    visited = [s];
    var available = lookAround(s);

    while(!found && isPossible) {

        var newOptions = [];

        var aLen = available.length;
        for (var i = 0; i < aLen; i++) {
            var a = available[i];

            visited.push(a);
            var currentOptions = lookAround(a);
            var coLen = currentOptions.length;
            for (var j = 0; j < coLen; j++) {
                var n = currentOptions[j];

                if (n.x === endX && n.y === endY) {
                    visited.push(n);
                    found = true;
                    break;
                } else {
                    if (!contains(newOptions, {x: n.x, y: n.y})) {
                        newOptions.push(n);
                    }
                }
            }
            if (found) {
                break;
            }
        }

        self.postMessage({
            type: 'debug',
            visited: visited,
            available: newOptions
        });

        if (newOptions.length < 1 && !found) {
            isPossible = false;
            break;
        }
        available = newOptions;
    }

    theWay = [];
    traverseBack(visited[visited.length - 1], s);
}

function contains(array, obj) {
    return _.findWhere(array, obj) !== undefined;
}

function traverseBack(o, start) {
    theWay.unshift(o);
    if (o.x === start.x && o.y === start.y) {
    } else {
        traverseBack(o.from, start);
    }
}

function lookAround(c) {
    var available = [];

    var p = {
        up: {
            x: c.x,
            y: c.y - 1,
            from: c
        },
        down: {
            x: c.x,
            y: c.y + 1,
            from: c
        },
        left: {
            x: c.x - 1,
            y: c.y,
            from: c
        },
        right: {
            x: c.x + 1,
            y: c.y,
            from: c
        },
        upleft: {
            x: c.x - 1,
            y: c.y - 1,
            from: c
        },
        upright: {
            x: c.x + 1,
            y: c.y - 1,
            from: c
        },
        downleft: {
            x: c.x - 1,
            y: c.y + 1,
            from: c
        },
        downright: {
            x: c.x + 1,
            y: c.y + 1,
            from: c
        }
    };

    if (isAvailable(p.up.x, p.up.y)) {
        available.push(p.up);
    }
    if (isAvailable(p.down.x, p.down.y)) {
        available.push(p.down);
    }
    if (isAvailable(p.left.x, p.left.y)) {
        available.push(p.left);
    }
    if (isAvailable(p.right.x, p.right.y)) {
        available.push(p.right);
    }

    /*
    if (isAvailable(p.upleft.x, p.upleft.y)) {
        if (isAvailable(p.up.x, p.up.y) || isAvailable(p.left.x, p.left.y)) {
            available.push(p.upleft);
        }
    }
    if (isAvailable(p.upright.x, p.upright.y)) {
        if (isAvailable(p.up.x, p.up.y) || isAvailable(p.right.x, p.right.y)) {
            available.push(p.upright);
        }
    }
    if (isAvailable(p.downleft.x, p.downleft.y)) {
        if (isAvailable(p.down.x, p.down.y) || isAvailable(p.left.x, p.left.y)) {
            available.push(p.downleft);
        }
    }
    if (isAvailable(p.downright.x, p.downright.y)) {
        if (isAvailable(p.down.x, p.down.y) || isAvailable(p.right.x, p.right.y)) {
            available.push(p.downright);
        }
    }
    */

    return available;
}

function isAvailable(x, y) {
    if (x < 1 || y < 1 || x >= maxX || y >= maxY) {
        return false;
    }

    if (contains(obstacles, {x: half(x * gridSize, false), y: half(y * gridSize, false)}) ||
        contains(visited, {x: x, y: y})) {
        return false;
    }
    return true;
}
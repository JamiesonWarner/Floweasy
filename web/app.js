Raphael.fn.connection = function (obj1, obj2, line, bg) {
    if (obj1.line && obj1.from && obj1.to) {
        line = obj1;
        obj1 = line.from;
        obj2 = line.to;
    }
    var bb1 = obj1.getBBox(),
    bb2 = obj2.getBBox(),
    p = [{x: bb1.x + bb1.width / 2, y: bb1.y - 1},
    {x: bb1.x + bb1.width / 2, y: bb1.y + bb1.height + 1},
    {x: bb1.x - 1, y: bb1.y + bb1.height / 2},
    {x: bb1.x + bb1.width + 1, y: bb1.y + bb1.height / 2},
    {x: bb2.x + bb2.width / 2, y: bb2.y - 1},
    {x: bb2.x + bb2.width / 2, y: bb2.y + bb2.height + 1},
    {x: bb2.x - 1, y: bb2.y + bb2.height / 2},
    {x: bb2.x + bb2.width + 1, y: bb2.y + bb2.height / 2}],
    d = {}, dis = [];
    for (var i = 0; i < 4; i++) {
        for (var j = 4; j < 8; j++) {
            var dx = Math.abs(p[i].x - p[j].x),
            dy = Math.abs(p[i].y - p[j].y);
            if ((i == j - 4) || (((i != 3 && j != 6) || p[i].x < p[j].x) && ((i != 2 && j != 7) || p[i].x > p[j].x) && ((i != 0 && j != 5) || p[i].y > p[j].y) && ((i != 1 && j != 4) || p[i].y < p[j].y))) {
                dis.push(dx + dy);
                d[dis[dis.length - 1]] = [i, j];
            }
        }
    }
    if (dis.length == 0) {
        var res = [0, 4];
    } else {
        res = d[Math.min.apply(Math, dis)];
    }
    var x1 = p[res[0]].x,
    y1 = p[res[0]].y,
    x4 = p[res[1]].x,
    y4 = p[res[1]].y;
    dx = Math.max(Math.abs(x1 - x4) / 2, 10);
    dy = Math.max(Math.abs(y1 - y4) / 2, 10);
    var x2 = [x1, x1, x1 - dx, x1 + dx][res[0]].toFixed(3),
    y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3),
    x3 = [0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3),
    y3 = [0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);
    var path = ["M", x1.toFixed(3), y1.toFixed(3), "C", x2, y2, x3, y3, x4.toFixed(3), y4.toFixed(3)].join(",");
    if (line && line.line) {
        line.bg && line.bg.attr({path: path});
        line.line.attr({path: path});
    } else {
        var color = typeof line == "string" ? line : "#000";
        return {
            bg: bg && bg.split && this.path(path).attr({stroke: bg.split("|")[0], fill: "none", "stroke-width": bg.split("|")[1] || 3}),
            line: this.path(path).attr({stroke: color, fill: "none"}),
            from: obj1,
            to: obj2
        };
    }
};

/**
 Construct a box containing class data. Returns a Raphael object.
*/
function constructBox(jsonData, x, y) {
    var box;
    if (x && y) {
        box = r.rect(x, y, 128, 64, 6);
    }
    else {
        box = r.rect(0, 0, 128, 64, 6);
    }
    box.mouseover(function() {
        box.stop().animate({transform: "s1.1 1.1"}, 50, "elastic", function() {
            box.stop().animate({transform: ""}, 500, "elastic");
        });
    });

    box.click(function() {
        // console.log("Click");
    });
    return box;
}

function connectBoxes(box1, box2, orPartner) {
    if (!orPartner) {
        connections.push(r.connection(box1, box2), "#fff");
    }
    else {
        connections.push(r.connection(box1, box2), "#000", "#fff");
    }
}

/**
 Gets the course Json representing a given course
*/
function getCourseJson(id, department) {
    var found = null;
    var courses = coursesJson[department];
    if (!courses) {
        console.log("ERROR: department not found: " + department);
        return;
    }
    var counter = 0;
    while (found == null && counter < courses.length) {
        var currentCourse = courses[counter];
        if (currentCourse.id == id) {
            found = currentCourse;
        }
        counter ++;
    }
    if (found == null) {
        console.log("ERROR: course not found: " + id);
    }
    return found;
}

function getCourseDepth(courseId, department) {
    // Recursive base case
    var courseJson = getCourseJson(courseId, department);
    if (courseJson == null) {
        console.log("ERROR: course not found: " + courseId + " in " + department);
        return 0;
    }
    var prereqs = courseJson.prerequisites;
    if (prereqs.length == 0) {
        return 0;
    }

    var maxChildrenDepth = 0;
    for (var i = 0; i < prereqs.length; i++) {
        var prereqObj = prereqs[i];
        var prereqDepth = getCourseDepth(prereqObj["id"],prereqObj["department"]);
        if (prereqDepth > maxChildrenDepth) {
            maxChildrenDepth = prereqDepth;
        }
    }

    return maxChildrenDepth + 1;
}

function findBox(courseId) {
    for (var i = 0; i < boxes.length; i++) {
        var box = boxes[i];
        var boxJson = box["json"];
        if (boxJson.id == courseId){
            return box;
        }
    }
    return null;
}

/**
 Builds a class tree from JSON data.
*/
function makeTree(jsonData) {
    // 2-d array.
    // 1 array per column of the flowchart
    var jsonColumns = [];

    // Put our Json data into jsonColumns
    for (var i = 0; i < jsonData.length; i++) {
        var course = jsonData[i];
        var courseDepth = getCourseDepth(course["id"],currentDepartment);

        if (!jsonColumns[courseDepth]) {
            jsonColumns[courseDepth] = [];
        }
        jsonColumns[courseDepth].push(course);
    }

    // Make objects out of the data we have in a 1-d array
    var x_start = 50;
    var y_start = 50;
    var x_separation = 200;
    var y_separation = 100;
    boxes = [];
    for (var i = 0; i < jsonColumns.length; i ++) {
        var jsonColumn = jsonColumns[i];
        var colColor = Raphael.getColor();
        for (var j = 0; j < jsonColumn.length; j ++) {
            // TODO give this a sexy transition
            var newX = x_start + x_separation * i;
            var newY = y_start + y_separation * j;
            var newBox = constructBox(jsonColumn[j], newX, newY);
            newBox.attr({fill: colColor, stroke: colColor, "fill-opacity": .4, "stroke-width": 2, cursor: "move"});
            newBox.json = jsonColumn[j];
            boxes.push(newBox);
        }
    }

    // Now iterate through all the boxes and add their prereqs visually
    for (var i = 0; i < boxes.length; i ++) {
        var box = boxes[i];
        var boxJson = box["json"];
        var boxPrereqs = boxJson["prerequisites"];
        for (var j = 0; j < boxPrereqs.length; j++) {
            var prereqJson = boxPrereqs[j];
            var prereqBox = findBox(prereqJson["id"]);
            if (!prereqBox) {
                continue;
            }
            connectBoxes(prereqBox, box);
        }
    }
}



var r;
var connections = [];
var coursesJson;
var currentDepartment = "Computer Science";
var departments = [];
var boxes;

window.onload = function () {
    r = Raphael("holder", $('#holder').width(), 1024);

    $.getJSON( "courses.json", function( data ) {
        // Build our list of departments
        for (dep in data) {
            departments.push(dep);
        }

        // Set global reference to all course data
        coursesJson = data;

        // Make our tree
        makeTree(coursesJson[currentDepartment]);
    });
};


/**
 * Gets the course JSON info for the given course.
 */
var findCourse = function(department, id, data) {
    var coursesInDepartment = data[department];
    if (!coursesInDepartment) {
        console.log("ERROR: Department not found: " + department);
        return;
    }

    // Iterate through courses in this department to find the one we want
    for (var i = 0; i < coursesInDepartment.length; i++) {
        var course = coursesInDepartment[i];
        if (course.id == id && course.department == department) {
            return course;
        }
    }
}

/**
 * Gets the depth in the tree of a given course.
 */
function getCourseDepth(department, id, data) {
    // Get the course object corresponding to this info
    var course = findCourse(courseId, department, data);
    if (!course) {
        console.log("ERROR: course not found: " + courseId + " in " + department);
        return 0;
    }

    // Recursive base case
    var prereqs = courseJson.prerequisites;
    if (prereqs.length == 0) {
        return 0;
    }

    // Find the maximum of the depth of its children
    var maxChildrenDepth = 0;
    for (var i = 0; i < prereqs.length; i++) {
        var prereqObj = prereqs[i];
        var prereqDepth = getCourseDepth(prereqObj["id"], prereqObj["department"], data);
        if (prereqDepth > maxChildrenDepth) {
            maxChildrenDepth = prereqDepth;
        }
    }

    // This node is one to the right of its children
    return maxChildrenDepth + 1;
}

/**
 * Gets the course tree in JSON for the given department.
 * Will call the callback function with parameter tree, an array of courses,
 * each of which has the following properties:
 *      id - course number
 *      department - department name of this course
 *      name - full name for this course
 *      description - text description of this course
 *      depth - depth in the tree, 0-based
 *      prerequisites - array of objects with:
 *          - department
 *          - id
 *          - course - reference to course object
 *          - misc metadata           
 *
 * @param {string} department The name of the department to build the tree for.
 * @param {function} callback The function to call when this is loaded.
 */
var buildCourseTree = function(department, callback) {
    // Helper function to copy json data into a tree node.
    // Does not do prerequisites.
    var jsonToNode = function(jsonData) {
        // Course to add to the tree
        var treeCourse = {};
        treeCourse.id = jsonData.id;
        treeCourse.department = department;
        treeCourse.name = jsonData.name;
        treeCourse.depth = getCourseDepth(department, jsonData.id, data);
        return treeCourse;
    }

    // Load the json data corresponding to this department from the server
    $.getJSON( "js/courses.json", function( data ) {
        // Get an array of courses we want to add to the tree
        var courses = data[department];
        if (!courses) {
            console.log("ERROR: Department not found: " + department);
            return;
        }

        // Preprocess courses to add non-department prereqs



        // Tree to return
        var tree = [];

        // Iterate through our data and add each course to the tree
        // (Prerequisites we do in the next step)
        for (var i = 0; i < courses.length; i++) {
            var thisCourse = courses[i];
            var treeCourse = jsonToNode(thisCourse);
            // Course to add to the tree
            tree.push(treeCourse);
        }

        // Now do prereqs
        for (var i = 0; i < courses.length; i++) {
            var thisCourse = courses[i];
            var treeCourse = tree[i];
            // Iterate through the prereqs of this course
            for (var j = 0; j < thisCourse.prerequisites.length; j++) {
                // Get the prereq course corresponding to this metadata
                var reqJson = thisCourse.prerequisites[j];
                var prereq = findCourse(reqJson.department, reqJson.id, data);

                // If we can't find the prereq in the json data, print an error message
                if (!prereq) {
                    console.log("ERROR: Unable to find course " + reqJson.department + " " + reqJson.id);
                    continue;
                }

                // If the course has a prereq not in the department, append it to the tree
                if (reqJson.department != department) {
                    // TODO might be duplicate course
                    var newCourse = jsonToNode(prereq);
                    tree.push(newCourse);
                }

                // Add the prereq to our node in the tree
            }
        }
    });
}

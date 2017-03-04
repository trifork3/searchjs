// initialize the canvas and create a border around it
var canvas = document.getElementById('app');
var context = canvas.getContext('2d');
context.strokeRect(0, 0, canvas.width, canvas.height);

// used to number the nodes (numbered depth-first style)
var currentNode = 0;

// constants
var MAX_RADIUS = 10;
var MAX_CHILDREN = 3;
var MAX_DEPTH = 5; // note that MAX_DEPTH is actually the number of rows minus one in the tree
var MIN_NODES = 10;
var MAX_NODES = 30;

// constructor for nodes
function Node(number, radius, x, y, parent, numChild, children, depth) {
    this.number = number;
    this.radius = radius;
    this.x = x;
    this.y = y;
    this.parent = parent;
    this.numChild = numChild;
    this.children = children;
    this.depth = depth;
}

// make the tree algorithmically via recursion
function makeTree(node) {
    if (node.depth == MAX_DEPTH) { return; }

    // create child nodes for however many children this node has
    for (var i = 0; i < node.numChild; i++) {
        // randomize the number of children for each of these child nodes;
        // if these children are leaves, just don't give them any children
        var numchild = Math.floor(Math.random() * (MAX_CHILDREN+1));
        if (node.depth == MAX_DEPTH-1) {
            numchild = 0;
        }

        newNode = new Node(currentNode++, node.radius, 0, 0, node, numchild, [], node.depth + 1);

        // add this new child to the parent's array
        node.children.push(newNode);

        // recursively make the children for this child node
        makeTree(newNode);
    }
}

// get an array of the arrays of nodes based on their depth (so the 0th row is just the root node,
// the 1st row is the nodes of depth 1, etc.)
function getQueues(node) {
    var list = [];

    // use a queue to go horizontally across the tree
    var queue = [ node ];
    while (queue.length > 0) {
        current = queue.shift();
        // only add a new row to the array if we have to (not doing this
        // causes errors when drawing)
        if (current.depth+1 > list.length) {
            list.push([]);
        }
        list[current.depth].push(current);

        for (var i = 0; i < current.numChild; i++) {
            queue.push(current.children[i]);
        }
    }

    return list;
}

/* actually draw the tree, with maximum width and height for the drawing: we draw the tree horizontally,
 * so nodes of the same depth are drawn on the same row; we also try to center the tree in the middle
 * of the drawing window; all the nodes on one row have the same radius */
function drawTree(node, maxWidth, maxHeight, shift) {
    // we actually only draw in a fraction of the drawing window
    var fullHeight = maxHeight * (3.0/4);

    var y = 0;                          // y-position of this row
    var rootRadius = node.radius;

    // the rows are evenly spaced from each other; this is the spacing factor
    var vspacing = (fullHeight - 2*rootRadius*MAX_DEPTH) / MAX_DEPTH;

    var queues = getQueues(node);

    //console.log(queues);

    // go through each row and draw the nodes
    for (var rows = 0; rows < queues.length; rows++) {
        var fullWidth = maxWidth * (3.0/4);

        var numNodes = queues[rows].length;
        var rowRadius = queues[rows][0].radius;

        // if there's only one node on this row, have no spacing
        var hspacing = numNodes == 1 ? 0 :
            (fullWidth - 2*rowRadius*numNodes) / (numNodes - 1);

        // we need the length that these nodes take up to find how much we need to offset to row to center it
        var rowLength = 2*numNodes*rowRadius + (numNodes - 1)*hspacing
        var centerOffset = 0.5*(maxWidth - rowLength);

        y += rowRadius;

        // actually draw the nodes
        for (var nodes = 0; nodes < queues[rows].length; nodes++) {
            queues[rows][nodes].x = (2*nodes + 1)*rowRadius + nodes*hspacing + centerOffset + shift;
            queues[rows][nodes].y = y;

            context.beginPath();
            context.arc(queues[rows][nodes].x, queues[rows][nodes].y, rowRadius, 0, 2*Math.PI, false);

            // draw the number of the node in its center; canvas draws text from the bottom left corner, so we need to adjust the
            // positioning to put it in the center
            context.font = String(2*rowRadius * (3.0/4)) + 'px serif';
            context.textAlign = 'center';
            context.fillText(queues[rows][nodes].number,
                queues[rows][nodes].x, queues[rows][nodes].y + .4*rowRadius);

            // connect the node to its parent via a line
            if (queues[rows][nodes].parent != null) {
                var factor = 1;
                if (queues[rows][nodes].x < queues[rows][nodes].parent.x) {
                    factor = -1;
                }

                // basically just draw the line between the centers of the nodes and erase the part inside the circle, so the line just touches the
                // the circumfrences of the nodes; the math is not bad
                var angle = Math.atan(Math.abs((queues[rows][nodes].y - queues[rows][nodes].parent.y) / (queues[rows][nodes].x - queues[rows][nodes].parent.x)));
                context.moveTo(queues[rows][nodes].parent.x + factor * queues[rows][nodes].parent.radius * Math.cos(angle),
                               queues[rows][nodes].parent.y + queues[rows][nodes].parent.radius * Math.sin(angle));
                context.lineTo(queues[rows][nodes].x - factor * queues[rows][nodes].radius * Math.cos(angle),
                               queues[rows][nodes].y - queues[rows][nodes].radius * Math.sin(angle));
            }

            context.stroke();
        }

        y += rowRadius + vspacing;
    }
}

// copy the tree found in copyNode into node by value, so node can be altered without altering copyNode
function copyTree(node, copyNode) {
    for (var i = 0; i < node.numChild; i++) {
        var copyChild = copyNode.children[i];
        node.children.push(new Node(copyChild.number, copyChild.radius, copyChild.x, copyChild.y, node, copyChild.numChild, [], copyChild.depth));
        copyTree(node.children[i], copyNode.children[i]);
    }
}

// find the order in which DFS searches the nodes
function dfs(root, nodes) {
    nodes.push(root);
    for (var i = 0; i < root.numChild; i++) {
        dfs(root.children[i], nodes);
    }
}

// find the order in which BFS searches the nodes
function bfs(root, nodes) {
    var queue = [ root ];
    while (queue.length > 0) {
        current = queue.shift();
        nodes.push(current);

        for (var i = 0; i < current.numChild; i++) {
            queue.push(current.children[i]);
        }
    }
}

// make sure the tree has a certain number of nodes for the asthetic
var dfsroot = null;
do {
    //if (dfsroot != null) { console.log("Rejected tree with " + currentNode + " nodes"); }

    currentNode = 0;
    dfsroot = new Node(currentNode++, MAX_RADIUS, 0, 0, null, MAX_CHILDREN, [], 0);
    makeTree(dfsroot);

} while (currentNode < MIN_NODES || currentNode > MAX_NODES)

drawTree(dfsroot, canvas.width/2, canvas.height, 0);

var bfsroot = new Node(dfsroot.number, dfsroot.radius, dfsroot.x, dfsroot.y, null, dfsroot.numChild, [], 0);
copyTree(bfsroot, dfsroot);
drawTree(bfsroot, canvas.width/2, canvas.height, canvas.width/2);

var dfslist = [], bfslist = [];
dfs(dfsroot, dfslist);
bfs(bfsroot, bfslist);

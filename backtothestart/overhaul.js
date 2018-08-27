/**
 * Create Groups
 * -------------
 * Isolate cycles which contain all concurrenct requisites
 * and groups of courses which all contain the the same requities,
 * By creating a parent node, and placing all children inside.
 * Grouping same requisites will help simplifying the graph for the
 * dagre algorithm, and ensure that they are placed next to each other. 
 * 
 * Assumptions
 *  - The graph has the compound setting turned on
 *  - There is no such thing as concurrent ORs, cause I don't know
 *    how I would draw that
 *  - Need to be able to handle nested groups, as concurrent groups
 *    likely have the same requisites
 */
 function createGroups(g){
 }

 /**
 * Run Dagre
 * -------------
 * Create a clone of the graph to pass to dagre which has
 *  - All logic nodes removed, and their edges duplicated to course nodes
 *  so that I get simple layers of courses, which I can push the logic
 *  nodes back inbetween each layer
 *  - All children of groups removed so that dagre only sees the
 *  parent groups
 * 
 * Assumptions
 *  - g.graph().groups exists and is sorted from smallest level to largest
 */
function rundagre(g){
}

 /**
 * Order Group Children
 * -------------
 * Because children were removed during dagre we need to add them back in
 * and figure out which order to put them in, to minimize the distance
 * between their successors
 */
function orderGroupChildren(g){
}

 /**
 * Fix Leaf Nodes
 * -------------
 * Dagre seems really bad at placing leaf nodes. Which is weird cause they
 * seem like the easiest ones to place. So we record all the empty spots 
 * that a node could fit in (plus the space taken by leaf nodes we are moving)
 * Then for each node, move it to the spot closest to the mean y coordinate 
 * of all it's predesssors weighted by their distance to the leaf node. 
 */
function fixLeafNodes(g){

}

 /**
 * Position Logics In Levels
 * -------------
 * Figure out which order the logics should be placed, and consequently
 * how many logic layers should be injected should be after each column.
 * 
 * These calculations are done lazily, using pixels instead of discrete layers
 * which makes a lot of bad assumptions
 * 
 * Assumptions
 *  - ranksep is greater than the number of logic layers needed * layersep
 *  - layersep is not 0
 */
function positionLogicsInLevels(g){
}

 /**
 * Compile Grid
 * -------------
 * It is useful later to iterate through the nodes, based on which column
 * they are in. This complies that ordering and saves it to the g.graph()
 * 
 * This function also injects the extra logic layer needed before a coure layer.
 */
function compileGrid(g){
}

 /**
 * Remove ANDs
 * -------------
 *  Removing all the AND logic nodes that do not go to an OR node next
 * This is so that if a course requries three courses, three lines are
 * going to the course. We need to not remove the ones going to OR nodes
 * cause that would make them look like they are part of the OR.
 *  For those ANDs going to ORs next, set their edge thickness 
 */
function removeANDs(g){
}

 /**
 * Adjust Logics
 * -------------
 * Logic nodes still do not have thier y coordinate set. A couple of heuristics
 * are used here, priority given as follows
 *  1. If all successors are on the next course column, and they are all courses
 *    Set position to the adverage of those courses
 *  2. If all predessesors are on the previous course column, and they are all courses
 *    Set position to the adverage of those courses
 *  3. Otherwise add to washermachine, where they get thier y set to a weighted mean of
 *    all their neighbors several times.
 * 
 * Assumptions
 *  - The assumption that logics are always surrounded by courses, needs to be fixed
 */
function adjustLogics(g){
}

 /**
 * Add Routing
 * -------------
 * Create the route graph to be used for the pathing algorithm and general positioning of 
 * paths. The route graph has two nodes for every course and logic node, one for entering
 * and exiting. The enter and exit nodes are not connected to each other to create a gap
 * in the graph that the pathing algorithm can't jump and hence can't route paths through
 * other courses. It gets bridge nodes added to the course columns, for paths to get around
 * courses. And route nodes added to every logic column surrounding a course, logic, or bridge
 * node. These route nodes are connected to each other vertically, but not horizontally to
 * avoid the pathing algorithm zigzagging through logic columns.
 */
function addRouting(g){
}

 /**
 * Find Paths
 * -------------
 * Copies the route graph to the type of graph that the pathing library uses.
 * After each path is found, it saves that path to the route graph, for later use
 * and so that the next path coming from that node can get a discount on using
 * the same path. Afterwards, this function removes all unused route nodes, to put less
 * load on later algorithms.
 * 
 * Currently the paths are saved to nodes, that will change to the route graph being a
 * multigraph and the paths being saved to edges. Also these edges will skip middle
 * routes to simplify later algorithms
 */
function findPaths(g,r){
}

 /**
 * Assign Lanes
 * -------------
 * Group the edges into lanes, and calculate the pull on each lane, assigning each
 * edge how much it should be offset of it's end points.
 */
function assignLanes(g,r){
}

 /**
 * Adjust Column Spacing
 * -------------
 * Now that it is possible to calculate the width of each column. Reassign all 
 * of the x coordinates, of all the nodes of both graphs.
 */
function adjustColSpacing(g,r){
}

 /**
 * fixLogicPathAlignment
 * -------------
 * Lanes need to do different things when they are turning onto a new street
 * with a logic at the end. So this is the last step in playing with the edge
 * offsets so that they fit the behavior ANDs and ORs should have.
 */
function fixLogicPathAlignment(g,r){
}

function layout(g){
  createGroups.time(g)
  rundagre.time(g)
  orderGroupChildren.time(g)
  fixLeafNodes.time(g)
  positionLogicsInLevels.time(g)
  compileGrid.time(g)
  removeANDs.time(g)
  adjustLogics.time(g)
  const r = addRouting.time(g)
  findPaths.time(g,r)
  assignLanes.time(g,r)
  adjustColSpacing.time(g,r)
  fixLogicPathAlignment.time(g,r)
  return r
}
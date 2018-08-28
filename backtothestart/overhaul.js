/**
 * Create Groups
 * -------------
 * Isolate cycles which contain all concurrenct requisites
 * and groups of courses which all contain the the same requities,
 * By creating a parent node, and placing all children inside.
 * Grouping same requisites will help simplifying the graph for the
 * dagre algorithm, and ensure that they are placed next to each other. 
 * 
 *  - Need to be able to handle nested groups, as concurrent groups
 *    likely have the same requisites
 * 
 * Assumptions
 *  - The graph has the compound setting turned on
 *  - Concurrent courses create cycles in the graph
 *  - There is no such thing as concurrent ORs, cause I don't know
 *    how I would draw that
 *  - All courses have only one parent (runs before ANDs get removed)
 */
/* Helper function to create the group */
function groupCourses(name,children,grouptype){
  // naming conventions just help with debugging
  name = '{'+name+'}' 
  var checked = []
  /* Recursively finds the root parent of the given node, 
  incrementing level if nested group is found */
  function rootparent(n){
    if(g.parent(n) && !checked.includes(g.parent(n))){
      // checks to make sure that the entire group is a sub group
      if(!g.children(g.parent(n)).every(child => children.includes(child))){
        throw new Error('Trying to create super group which does not contain all children')
      } else {
        g.node(g.parent(n)).level++
        checked.push(g.parent(n))
      }
    }
    return g.parent(n) ? rootparent(g.parent(n)) : n
  }
  /* Create the parent node */
  g.setNode(name,{
    type:'group',
    grouptype:grouptype,
    width:g.graph().nwidth,
    coursechildren:children,
    // level is incremented in the rootparent function, if nested groups are found
    level:0
  })
  /* Add all the root parents of the children as children to the created parent node */
  children
    .map(child => rootparent(child))
    .forEach(child => g.setParent(child,name))

  // Setting height afterwards for the case of nested groups
  // Adding up the heights instead of numchildren*nheight, cause nested groups have abnormal heights
  // Same Parent groups need to account for nodesep, 
  // concurrent groups don't have nodesep
  g.node(name).height = g.children(name).reduce((sum,n) => sum+g.node(n).height,0) + 
    (g.children(name).length-1)*g.graph().nodesep*(grouptype=='same parent')
}
/* Find all the groups and send them to `groupCourses` */
function createGroups(g){
  /* Concurrent Groups */
  dagre.graphlib.alg.findCycles(g).forEach(cycle => {
    // Cycle is considered a concurrent group if every 
    // internal connection is of type 'concur'
    var isConcurrentGroup = cycle.every(n => {
      return g.nodeEdges(n)
        .filter(e => cycle.includes(e.v) && cycle.includes(e.w))
        .every(e => g.edge(e).type == 'concur')
    })

    if(isConcurrentGroup){
      // remove the excess nodes and edges
      var children = cycle.filter(n => {
        if(g.node(n).type == 'logic'){
          g.removeNode(n)
          return false
        } else {
          g.outEdges(n)
            .filter(e => cycle.includes(e.w))
            .forEach(e => g.removeEdge(e))
          return true
        }
      })
      groupCourses(children.join(' '),children,'concurrent')
    }
  })
  /* Same Parent Groups */
  var parents = g.nodes()
    .filter(n => g.node(n).type == 'course')
    .reduce((parents,n) => {
      var parent = g.predecessors(n)
      if(parent.length==1){
        parents[parent[0]] = parents[parent[0]] || []
        parents[parent[0]].push(n)
      }
      return parents
    },{})
  Object.entries(parents).forEach(([n,children]) => {
    // don't create groups with only one child,
    if(children.length > 1){
      groupCourses(n,children,'same parent')
    }
  })

  /* Create g.graph().groups */
  // Cache a list of groups created, sorted from lowest level to highest
  // just to that I don't have to do this expensive operation multiple times
  g.graph().groups = g.nodes()
    .filter(n => g.node(n).type=='group')
    .sort((a,b) => g.node(a).level-g.node(b).level)
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
 *  - g.graph().groups exists
 */
function rundagre(g){
  /* Helper function to add edges with the correct weight */
  function addEdge(v,w,e){
    var weight = (clone.edge(e) && clone.edge(e).weight) || 1
    if(!clone.node(v) || !clone.node(w)){
      console.error('Trying to set an edge to a node that does not exist')
    }
    if(clone.edge(v,w)==undefined){
      clone.setEdge(v,w,{weight})
    } else {
      clone.edge(v,w).weight+=weight
    }
  }
  /* Create a clone of the graph */
  var clone = new dagre.graphlib.Graph()
  clone.setGraph(g.graph())
  g.nodes().forEach(n => clone.setNode(n,g.node(n)))
  g.edges().forEach(({v,w}) => clone.setEdge(v,w,g.edge(v,w)))
  /* Remove all logic nodes */
  g.nodes().filter(n => g.node(n).type=='logic').forEach(n => {
    // Replace their edges to go directly from their parents to their children
    var edges = clone.nodeEdges(n)
    clone.predecessors(n).forEach(pre => {
      clone.successors(n).forEach(suc => {
        clone.setEdge(pre,suc,{})
      })
    })
    clone.removeNode(n)
  })
  /* Remove all group children */
  // from lowest to highest so that the root level collects all the connections
  g.graph().groups.slice()
    .sort((a,b) => g.node(b).level-g.node(a).level)
    .forEach(n => {
      g.children(n).forEach(child => {
        clone.inEdges(child).forEach(e => addEdge(e.v,n,e))
        clone.outEdges(child).forEach(e => addEdge(n,e.w,e))
        clone.removeNode(child)
      })
    })
    
  // Send the clone to dagre
  dagre.layout(clone)
  window.clone = clone // Just for debugging, please remove

  // Temporarily assign the group children the same coordinates as their parents
  g.graph().groups.forEach(parent => {
    g.children(parent).forEach(child => {
      g.node(child).x = g.node(parent).x
      g.node(child).y = g.node(parent).y
    })
  })
}

 /**
 * Create Grid
 * -------------
 * Creating a grid for convience. Only has the courses, for now. Will add logics
 * later.
 */
function createGrid(g){
  /* Collect all the nodes by there x coordinate */
  var columns = g.nodes()
    .filter(n => g.node(n).type!='logic')
    .reduce((cols,n) => {
      cols[g.node(n).x] = cols[g.node(n).x] || {x:g.node(n).x,type:'course',nodes:[]}
      cols[g.node(n).x].nodes.push(n)
      return cols
    },{})
    
  /* Sort the columns by x coordinate, then turn into something like a linked list */
  g.graph().columns = Object.entries(columns)
    .sort((a,b) => a[0] - b[0])
    .map(([,col],i) => {
      col.level = [i+1,0]
      col.key = col.level.join('.')
      col.nodes.forEach(n => {
        g.node(n).level = col.level
        g.node(n).colkey = col.key
      })
      return col
    })
    .reduce((obj,col,i,grid) => {
      col.prev = grid[i-1]
      col.next = grid[i+1]
      obj[col.key] = col
      return obj
    },{})
  g.graph().root = g.graph().columns['1.0']
}

 /**
 * Order Group Children
 * -------------
 * Because children were removed during dagre we need to add them back in
 * and figure out which order to put them in, to minimize the distance
 * between their successors
 */
function orderGroupChildren(g){
  g.graph().groups.forEach(parent => {
    g.children(parent).map(n => {
      // Sum up the total distance this nodes children are away from it
      var i = findCourses(g,n,'successors').reduce((sum,n) => sum+(g.node(n).y-g.node(parent).y),0)
      return {n,i}
    })
    // order them based on which way they want to be pulled
    .sort((a,b) => a.i-b.i)
    .reduce((y,{n}) => {
      // Assign each nodes y coordinate
      g.node(n).y = y+g.node(n).height/2
      return y + g.node(n).height + 
      // Only include the nodesep if grouptype is not same parent
        g.graph().nodesep*(g.node(parent).grouptype=='same parent')
    },g.node(parent).y-g.node(parent).height/2)
  })
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
  // how much space is required to fit a node
  const spaceheight = g.graph().nheight+g.graph().nodesep*2
  // replace the space with two spaces, surrounding this node
  function split(space,i,node){
    return space.splice(i,1,
      [space[i][0],node.y-(node.height/2)],
      [node.y+(node.height/2),space[i][1]])
  }
  /* Get all the leafs */
  // are not part of a group, and have only one neighbor
  var leafs = g.nodes().filter(n => 
      !g.parent(n) &&
      g.node(n).type == 'course' &&
      g.neighbors(n).length == 1)
  
  /* Find all the spaces in each column */
  var columnSpaces = window.columnSpaces = {}
  for(var col = g.graph().root; col; col = col.next){
    var spaces = [[0,g.graph().height]]
    col.nodes
      .filter(n => !g.parent(n) && !leafs.includes(n))
      .forEach(n => {
        var i = spaces.findIndex(([from,to]) => {
          return from < g.node(n).y && g.node(n).y < to
        })
        if(i != -1){
          split(spaces,i,g.node(n))
        }
      })
    columnSpaces[col.key] = spaces
  }

  /* Insert the leafs into the spaces */
  // TODO: find some importance to sort the leafs by
  leafs.forEach(n => {
    var node = g.node(n),
      parents = findCourses(g,n,g.predecessors(n).length?'predecessors':'successors'),
      mean = weightedMean(g,n,parents),
      spaces = columnSpaces[node.colkey]
      closesti=null,closestdist=null

    /* Find the closest space that has room */
    spaces.forEach(([from,to],i) => {
      if(to-from > spaceheight){ /* has room */
        var dist = Math.min(Math.abs(from-mean),Math.abs(to-mean))
        if(closesti==null || dist < closestdist){ /* is closer */
          closesti = i
          closestdist = dist
        }
      }
    })
    /* Insert into the space */
    // guarenteed to be a space, because if anything it will
    // go back to it's original spot from which it was removed
    var closest = spaces[closesti]
    // adjust the mean to be within the space 
    // (but on the side where it came from)
    mean = Math.max(mean,closest[0]+spaceheight/2)
    mean = Math.min(mean,closest[1]-spaceheight/2)
    node.y = mean
    split(spaces,closesti,node)
  })
}

 /**
 * Position Logics In Levels
 * -------------
 * Figure out which order the logics should be placed, and consequently
 * how many logic layers should be injected should be after each column.
 */
function positionLogicsInLevels(g){
  const lessThan = (a,b) => a < b
  /* Recursively find the farthest parent each node has, and push them to the next array in slots */
  g.nodes().forEach(function ranker(n){
    if(g.node(n).type == 'logic' && g.node(n).x == undefined){
      var farthest = g.predecessors(n)
        // recurse if they also do not have their level set
        .map(n => g.node(n).level || ranker(n))
        // Find the farthest parent
        .reduce((max,level) => compareLevels(max,level,lessThan) ? level : max,[0,0])

      g.node(n).level = farthest.slice()
      g.node(n).level[1]++ // Increment to the next logic column
      g.node(n).colkey = g.node(n).level.join('.')
    }
    return g.node(n).level
  })
}

 /**
 * Add Logics To Grid
 * -------------
 * The logics now have their level assigned, so now we can add them to 
 * the grid. Also need to add in an extra empty logic column in front
 * of every course column. So that the edges coming out of the last logic
 * column before a course column has room to get to where it needs to go.
 */
/* Helper function to insert node into g.graph().columns */
function splice(g,prev,node){
  var next
  
  if(!prev){
    next = g.graph().root
    g.graph().root = node
  } else {
    next = prev.next
    prev.next = node
    node.prev = prev
  }

  if(next){
    next.prev = node
    node.next = next
  }
  g.graph().columns[node.key] = node
}

function addLogicsToGrid(g){
  // cache this function, so that we don't have to keep creating it
  const greaterThan = (a,b) => a > b
  /* Insert all of the logics */
  g.nodes().filter(n => g.node(n).type == 'logic').forEach(n => {
    var node = g.node(n), col = g.graph().columns[node.colkey]
    // if column doesn't exist, then create it
    if(!col){
      col = {level:node.level,key:node.colkey,type:'logic',nodes:[]}
      var prev, iter = g.graph().root
      // Find the spot it is supposed to go in
      while(iter && compareLevels(node.level,iter.level,greaterThan)){ prev = iter; iter = iter.next }
      // Insert it into the grid at that spot
      splice(g,prev,col)
    }
    col.nodes.push(n)
  })
  /* Insert the extra logic columns */
  for(var col = g.graph().root; col; col = col.next){
    // if the next column is a course then insert here
    if(col.next && col.next.type == 'course'){
      var level = col.level.slice()
      level[1]++
      splice(g,col,{
        level:level,
        key:level.join('.'),
        type:'logic',
        nodes:[]
      })
      // jump the iterator over the one we just created
      col = col.next
    }
  }
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
  var x = g.graph().marginx || 0
  for(var col = g.graph().root; col; col = col.next){
    if(col.type=='course'){
      if(col.prev){
        // buffer between this column and the last
        x += g.graph().ranksep/2
      }
      x += g.graph().nwidth
      col.nodes.forEach(n => {
        g.node(n).x = x
      })
      if(col.next){
        // other half of the buffer
        x += g.graph().ranksep/2
      }
    } else {
      col.nodes.forEach(n => {
        g.node(n).x = x
      })
      if(col.next && col.next.type!='course'){
        x += g.graph().layersep
      }
    }
  }
  g.graph().width = x + (g.graph().marginx||0)
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
  createGrid.time(g)
  orderGroupChildren.time(g)
  fixLeafNodes.time(g)
  positionLogicsInLevels.time(g)
  addLogicsToGrid.time(g)
  removeANDs.time(g)
  adjustLogics.time(g)
  const r = addRouting.time(g)
  findPaths.time(g,r)
  assignLanes.time(g,r)
  adjustColSpacing.time(g,r)
  fixLogicPathAlignment.time(g,r)
  return r
}
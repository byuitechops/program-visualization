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
  /* Add an indirect edge with the proper weight */
  function addEdge(v,w,e){
    var weight = e.weight || 1
    if(!g.node(v) || !g.node(w)) throw new Error('Trying to set an edge to a node that does not exist')
    if(g.edge(v,w)==undefined){
      g.setEdge(v,w,{weight:weight,indirect:true})
    } else {
      g.edge(v,w).weight+=weight
    }
  }
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
    .forEach(child => {
      g.setParent(child,name)
      g.inEdges(child).forEach((e) => addEdge(e.v,name,g.edge(e)))
      g.outEdges(child).forEach((e) => addEdge(name,e.w,g.edge(e)))
    })

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
  graphlib.alg.findCycles(g).forEach(cycle => {
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

  /* Create g.graph().groups */
  // Cache a list of groups created, sorted from lowest level to highest
  // just to that I don't have to do this expensive operation multiple times
  g.graph().groups = g.nodes()
    .filter(n => g.node(n).type=='group')
    .sort((a,b) => g.node(a).level-g.node(b).level)
}

/**
 * Fix Cycles
 * -------------
 * Any cycles in the graph will not only put many of the functions into infinite loops
 * but make it impossible to determine which column to put the nodes on. So to circumvent
 * this find the cycles in the graph and reverse one of the edges to break the cycle. This
 * process needs to be repeated until no cycles are found because there can
 * be cycles inside of cycles, so need to keep breaking them
 */
function fixCycles(){
  do {
    var cycles = graphlib.alg.findCycles(g)
    cycles.forEach(cycle => {
      // find an edge in the cycle (not always a connection between the first two)
      var v = cycle[0], w = g.successors(v).find(n => cycle.includes(n))
      var edge = g.edge(v,w)
      edge.reversed = true
      g.removeEdge(v,w)
      g.setEdge(w,v,edge)
    })
  } while(!graphlib.alg.isAcyclic(g))
}

/**
 * Ranking
 * -------------
 * Greedy algorithm to determine which rank to put each node on.
 */
function rankNode(g,grid,n){
  // cache this function so that it isn't create a million times
  const greaterThan = (a,b) => a > b
  // save these to variables purely for convience
  var node = g.node(n)
  if(node.rank == null){
    // get the ranks of our parents (recursing if they do not have a rank assigned yet)
    var parents = g.predecessors(n).map(n => g.node(n).rank != null ? g.node(n) : rankNode(g,grid,n))

    // If adding the parents some how added ours, then we are done
    if(node.rank != null) return node

    // Find which parent is the farthest forward
    var parent = parents.reduce((farthest,node) => {
      return compareLevels(node.rank,farthest.rank,greaterThan) ? node : farthest
    },grid[0][0])

    // Add this node to the column after our furthest parent
    // minor step if a logic, major step if a course
    node.rank = parent.rank.slice()
    if(node.type=='logic'){
      node.rank[1]++
    } else {
      node.rank[0]++
      node.rank[1]=0
    }
    var col = grid[node.rank[0]] && grid[node.rank[0]][node.rank[1]]
    // if col is not already in the grid
    if(!col){
      // create the column
      grid[node.rank[0]] = grid[node.rank[0]] || []
      col = grid[node.rank[0]][node.rank[1]] = {
        type:node.type,
        rank:node.rank,
        nodes:[],
      }
    }
    // Don't want to add the sub nodes, yet just the parent groups
    if(!g.parent(n)){
      col.nodes.push(n)
    }
  }

  // We still need to check that all of our children have a rank even
  // if this node has already gotten it's rank assigned
  g.successors(n).filter(n => g.node(n).r == null).forEach(n => rankNode(g,grid,n))

  return node
}

function ranking(g){
  var grid = [[{rank:[0,0],type:'root'}]]

  // for each component in our graph get the recursive rank function running
  graphlib.alg.components(g).forEach(component => {
    rankNode(g,grid,component[0])
  })

  // Add in the extra logic columns
  for(var c = 0; c < grid.length; c++){
    // this will make the last column of the grid a 'logic' column, 
    // but that's okay because of the rare case of a course in the 
    // last column needing to cycle back to a previous node

    // don't add one for first column, unless there are logic nodes first 
    if(grid[c][0].type != 'root' || grid[c].length != 1){
      grid[c].push({
        type:'logic',
        rank:[c,grid[c].length],
        nodes:[],
      })
    }
  }

  g.graph().getColumn = function(c,l){
    // saving the grid in this function
    // grid won't be accesable otherwise
    if(Array.isArray(c)) l = c[1], c = c[0]
    if(l == undefined) l = 0
    return grid[c] && grid[c][l]
  }

  g.graph().columns = []
  for(var c = 0; c < grid.length; c++){
    for(var l = 0; l < grid[c].length; l++){
      if(grid[c][l].type != 'root'){
        g.graph().columns.push(grid[c][l])
      }
    }
  }

  g.graph().columns.forEach((col,ci) => {
    col.ci = ci
    col.nodes.forEach(n => g.node(n).ci = ci)
  })
}

/**
 * Create Bridge Nodes
 * -------------------
 * 
 */
function createBridgeNodes(g){
  g.edges().forEach(e => {
    // stay compatible with backwards linked nodes (which shouldn't exit but just in case)
    var [v,w] = [e.v,e.w].sort((a,b) => g.node(a).ci-g.node(b).ci)
    var last = v
    for(var ci = g.node(v).ci+1; ci < g.node(w).ci; ci++){
      if(g.graph().columns[ci].rank[1] == 0){
        // console.log(g.node(v).ci,ci)
        var name = v+Array(ci-g.node(v).ci+1).join('>')+w
        g.setNode(name,{
          type:'bridge',
          rank:g.graph().columns[ci].rank,
          ci:ci,
          width:0,
          height:g.graph().nheight,
        })
        // console.log(last,name)
        g.setEdge(last,name,Object.assign({old:e},g.edge(e)))
        g.graph().columns[ci].nodes.push(name)
        last = name
      }
    }
    if(last != v){
      // console.log(last,w)
      g.setEdge(last,w,Object.assign({old:e},g.edge(e)))
      g.removeEdge(v,w)
    }
  })
}

/**
 * Initial Positions
 * -----------------
 * Setting the X and Y coordinate of each node, so that the ordering algorithm has
 * something to work with when doing all of it's collision detection and such. Also
 * adding a couple of arbitrary heuristics to improve the output of the ordering 
 * algorithm. These include justifying the node's vertical position so that they are
 * evenly spread out with plenty of room to play with. Also ording the nodes in alphabetical
 * order where they have a good chance of being next to the ones that they should
 * be next to (same department)
 */
function initialPositions(g){
  var x = g.graph().marginx||0
  var maxheight = 0
  // Find the tallest column, so that we can vertically center all of the columns
  g.graph().columns.forEach(col => {
    col.height = col.nodes.reduce((sum,n) => sum+g.node(n).height,0)
    maxheight = Math.max(maxheight,col.height + (col.nodes.length-1)*g.graph().nodesep)
  })
  // maxheight = maxheight * 1.3
  g.graph().columns.forEach((col,ci) => {
    var y = g.graph().marginy||0// + (maxheight-col.height)/2
    // padding between layers
    x += g.graph().layersep
    // account for node width (shouldn't vary between nodes)
    if(col.type == 'course') x += g.graph().nwidth
    /* debugging */col.x = x
    // set the node coordinates
    col.nodes.sort().forEach((n,i) => {
      g.node(n).x = x
      // account for spacing between nodes
      if(i != 0) y += (maxheight-col.height)/(col.nodes.length-1)
      // padded by node height
      y += g.node(n).height/2
      g.node(n).y = y
      y += g.node(n).height/2
    })
  })
  g.graph().groups.forEach(p => {
    g.children(p).forEach(n => {
      g.node(n).x = g.node(p).x
      g.node(n).y = g.node(p).y
    })
  })
  g.graph().width = x + (g.graph().marginx||0)
  g.graph().height = maxheight + (g.graph().marginy||0)
}

function* order(g){
  window.boxes = []
  const hasCollision = (a,b) => a.y-a.height/2 < b.y+b.height/2 && a.y+a.height/2 > b.y-b.height/2
  function calcY(){
    var sum=0,totalweight=0,weight
    if(!this.influences.length) return this.node.y
    this.influences.forEach(node => {
      weight = 1//1/Math.abs(this.node.x-node.x)
      sum += node.y * weight
      totalweight += weight
    })
    return this.y = sum/totalweight
  }
  function calcPull(y){ return this.pull = this.influences.reduce((sum,node) => sum+(node.y-y),0) }
  const boxes = g.graph().columns.map(col => col.nodes.map(n => ({
    id:n,
    node:g.node(n),
    influences:g.neighbors(n).map(n => g.node(n)),
    calcPull,
    calcY,
  })))
  for(var round = 0; round < 100; round++){
    /* debugging */var nodes = []
    // TODO: There is probably be a good heuristic order in 
    // which to sort the nodes by (least amount of connections 
    // to greatest or something)
    for(var ci = 0; ci < boxes.length; ci++){
      var col = g.graph().columns[ci]
      var bubbles = []
      for(var bi = 0; bi < boxes[ci].length; bi++){
        var box = boxes[ci][bi]

        /* Calculate where this box now wants to be */
        box.calcY()

        var currentbubble = Object.assign([box],{
          height:box.node.height+g.graph().nodesep,
          y:box.y
        })
        /* debugging */box.node.y = currentbubble.y

        /* While we keep running into other groups */
        var done = false
        while(!done){
          /* Seperate bubbles that have collisions from those that don't */
          var collisions = [], other = []
          bubbles.forEach(bubble => hasCollision(bubble,currentbubble) ? collisions.push(bubble) : other.push(bubble))
          bubbles = other

          /* If no collisions exit the loop */
          if(collisions.length == 0){ 
            done = true
            continue
          }

          /* Merge collisions into one group */
          collisions.forEach(bubble => {
            currentbubble.push(...bubble)
          })

          /* Set currentbubble.y to the mean of boxes .y */
          currentbubble.y = currentbubble.reduce((sum,box) => sum+box.y,0)/currentbubble.length

          /* Sort currentbubble's nodes based on the pull of their influences */
          currentbubble.forEach(box => box.calcPull(currentbubble.y))
          currentbubble.sort((a,b) => a.pull-b.pull)

          /* Set currentbubble.height to sum of boxes.height plus nodesep */
          currentbubble.height = currentbubble.reduce((sum,box,i) => {
            if(!(box.node.type == 'bridge' && i && currentbubble[i-1].node.type=='bridge')){
              sum += box.node.height+g.graph().nodesep
            }
            return sum
          },0)
        }
        bubbles.push(currentbubble)
        currentbubble.x = col.x, currentbubble.type = col.type, window.boxes[ci] = bubbles
        // nodes.push(box.id), yield nodes
      }
      /* Set the node's new position */
      bubbles.forEach(bubble => {
        var y = bubble.y - bubble.height/2
        bubble.forEach((box,i) => {
          var skip = box.node.type == 'bridge' && i && bubble[i-1].node.type=='bridge'
          if(!skip) y += box.node.height/2
          box.node.y = y
          g.children(box.id).forEach(n => g.node(n).y = y)
          if(!skip) y += box.node.height/2 + g.graph().nodesep
        })
      })
    }
    var max = Math.max(...g.nodes().map(n => g.node(n).y+g.node(n).height/2))
    var min = Math.min(...g.nodes().map(n => g.node(n).y-g.node(n).height/2))
    g.nodes().forEach(n => g.node(n).y += 0-min)
    {[].concat(...window.boxes).filter(n => n).forEach(box => box.y += 0-min)}
    g.graph().height = max-min
    yield
  }
}

function* layout(g){
  createGroups.time(g)
  fixCycles.time(g)
  ranking.time(g)
  createBridgeNodes.time(g)
  initialPositions.time(g)
  yield * order.time(g)
} 
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
    // won't be accesable otherwise
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
}

/**
 * Initial Positions
 * -------------
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
    col.x = x
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
  const breaksize = 6
  function calcPosition(group){
    var height = group.length * (g.graph().nheight+g.graph().nodesep)
    var sum = 0, count = 0
    group.forEach(box => {
      height += box.length * g.graph().nodesep
      count += box.length
      box.forEach(n => {
        height += g.node(n).height
        sum += g.node(n).y
      })
    })
    // Set height to sum height of all nodes, 
    //  plus nheight for seperation between each box
    //  plus nodesep for each node
    group.height = height
    // Set Y to 
    group.y = sum/count
    // Find how many breaks it needs
    group.numbreaks = Math.floor(count/breaksize)
  }
  function mergeGroups(groups,group){
    groups.forEach(otherGroup => {
      otherGroup.forEach(box => {
        box.forEach(n => {
          var k = 0, node = g.node(n)
          // node is not allowed to be in the same box as another node who was in the same group but different box
          // because they have already been seperated, so keep them sepereated
          // console.log(n,node.group,node.box)
          if(round){
            while(group[k].filter(n => g.node(n).group).some(n => /* g.node(n).group == node.group &&  */g.node(n).box != node.box)){
              // console.log(g.node(n).group)
              // group[k].filter(n => g.node(n).group).forEach(n => console.log(n,g.node(n).group == node.group,g.node(n).box == node.box))
              ++k
              group[k] = group[k] || []
            }
          }
          group[k].push(n)
        })
      })
    })
  }
  
  for(var round = 0; round < 100; round++){
    window.boxes = []
    var nodes = []
    // TODO: There is probably be a good heuristic order in 
    // which to sort the nodes by (least amount of connections 
    // to greatest or something)
    for(var ci = 0; ci < g.graph().columns.length; ci++){
      var col = g.graph().columns[ci]
      var groups = []
      for(var ni = 0; ni < col.nodes.length; ni++){
        var n = col.nodes[ni]
        /* Temporarily set node's Y to it's optimal position */
        var node = g.node(n)
        node.y = weightedMean(g,n,g.neighbors(n))
        var position = {
          y: node.y,
          // add the padding
          height: node.height + g.graph().nodesep,
          numbreaks:0,
        }
        var group = Object.assign([Object.assign([n],position)],position)

        var done = false;
        while(!done){
          /* Remove all the groups that have collisions */
          var collisions = [], other = []
          groups.forEach(otherGroup => hasCollision(otherGroup,group) ? collisions.push(otherGroup) : other.push(otherGroup))
          groups = other

          /* If no collisions exit the loop */
          if(collisions.length == 0){ 
            done = true
            continue
          }

          /* Had collisions, merge them into one group */
          mergeGroups(collisions,group)

          /* Calculate the new position of the combined group */
          calcPosition(group)
        }
        groups.push(group)

        nodes.push(n)
        col.groups = groups
        // if(round) yield nodes
        // yield nodes
      }
      /* Position nodes within groups according to where they want to be */
      groups.forEach((group,gi) => {
        var nodes = group.reduce((arr,box) => {
          box.forEach(n => {
            var pull = g.neighbors(n).reduce((sum,n) => sum+(g.node(n).y-group.y),0)
            arr.push({n,pull})
          })
          return arr
        },[]).sort((a,b) => a.pull-b.pull).map(n => n.n)
        
        var breaks = nodes.slice(0,-1)
          .map((n,i) => {
            var dist = g.node(nodes[i+1]).y - g.node(n).y
            return {n,dist}
          })
          .sort((a,b) => b.dist-a.dist)
          .slice(0,group.numbreaks)
          .reduce((obj,{n}) => (obj[n] = true,obj),{})

        // Create new grouping to be referenced during the next run
        var k = 0
        var boxes = nodes.reduce((boxes,n) => {
          g.node(n).box = boxes[k]
          g.node(n).group = boxes
          boxes[k].push(n)
          if(breaks[n]){
            boxes.push([])
            k++
          }
          return boxes
        },[[]])

        // Object.keys(breaks).length && console.log('breaks',breaks)
        
        var y = group.y - group.height/2// + g.graph().nodesep/2
        boxes.forEach(box => {
          box.forEach(n => {
            y += g.node(n).height/2
            g.node(n).y = y
            g.children(n).forEach(n => g.node(n).y = y)
            y += g.node(n).height/2 + g.graph().nodesep
          })
          y += g.graph().nheight + g.graph().nodesep
        })
        window.boxes.push((props => Object.assign(boxes.map(box => Object.assign(box,props)),props))({x:col.x,type:col.type}))
      })
    }
    var max = Math.max(...g.nodes().map(n => g.node(n).y+g.node(n).height/2))
    var min = Math.min(...g.nodes().map(n => g.node(n).y-g.node(n).height/2))
    g.nodes().forEach(n => g.node(n).y += 0-min)
    g.graph().height = max-min
    yield
  }
}

function* layout(g){
  createGroups.time(g)
  fixCycles.time(g)
  ranking.time(g)
  initialPositions.time(g)
  yield * order.time(g)
}
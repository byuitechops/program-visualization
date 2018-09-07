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
function rankNode(g,n){
  // cache this function so that it isn't create a million times
  const greaterThan = (a,b) => a > b
  // save these to variables purely for convience
  var node = g.node(n)
  var grid = g.graph().grid

  if(node.r == null){
    // get the ranks of our parents (recursing if they do not have a rank assigned yet)
    var parents = g.predecessors(n).map(n => g.node(n).r != null ? g.node(n) : rankNode(g,n))
    
    // If adding the parents some how added ours, then we are done
    if(node.r != null) return node

    // Find which parent is the farthest forward
    var parent = parents.reduce((r,node) => {
      return compareLevels(grid(r).rank,grid(node.r).rank,greaterThan) ? r : node.r
    },0)

    // Add this node to the column after our furthest parent
    // minor step if a logic, major step if a course
    node.rank = grid(parent).rank.slice()
    if(node.type=='logic'){
      node.rank[1]++
      node.r = node.rank.join('.')
      if(!grid(node.r)){
        // console.log(node.r,grid(node.rank[0]).children(),grid(node.rank[0]).head,grid(node.rank[0]).tail)
        grid(node.rank[0]).push(node.r,{
          type:'logic',
          rank:node.rank,
          nodes:[],
          height:-g.graph().nodesep
        })

      }
    } else {
      node.rank[0]++
      node.rank[1]=0
      node.r = node.rank[0]
      if(!grid(node.r)){
        // console.log(grid(node.r).children())
        grid(grid.head.id).push(node.r,{
          type:'course',
          rank:node.rank,
          nodes:[],
          height:-g.graph().nodesep
        })
      }
    }
    if(!g.parent(n)){
      grid(node.r).nodes.push(n)
      grid(node.r).height += (node.height||0) + g.graph().nodesep
    }
  }

  // We still need to check that all of our children have a rank even
  // if this node has already gotten it's rank assigned
  g.successors(n).filter(n => g.node(n).r == null).forEach(n => rankNode(g,n))

  return node
}

function ranking(g){
  g.graph().grid = poptart()
  g.graph().root = g.graph().grid.head.push(0,{rank:[0,0]})

  // for each component in our graph get the recursive rank function running
  graphlib.alg.components(g).forEach(component => {
    rankNode(g,component[0])
  })

  // Add in the extra logic columns
  // for(var col = g.graph().root.next; col; col = col.next){
  //   if(col.p){
  //     // col.insertBefore()
  //     console.log(col.prev && col.prev.length)
  //   }
  // }
}

function initialPositions(g){
  var x = g.graph().marginx||0
  var height = 0
  for(var col = g.graph().root.next; col; col = col.next){
    height = Math.max(height,col.height)
  }
  for(var col = g.graph().root.n; col; col = col.n){
    var y = g.graph().marginy||0

    if(col.type=='course'){
      if(col.prev != g.graph().root){
        // buffer between this column and the last
        x += g.graph().ranksep/2
      }
      x += g.graph().nwidth
      // sort the nodes alphabetically by name, to preliminarily group similar types
      col.nodes.sort().forEach(n => {
        g.node(n).x = x
        y += g.node(n).height/2
        g.node(n).y = y
        y += g.node(n).height/2 + g.graph().nodesep
      })
      if(col.n){
        // other half of the buffer
        x += g.graph().ranksep/2
      }
    } else {
      col.nodes.forEach(n => {
        g.node(n).x = x
        y += g.graph().nheight/2
        g.node(n).y = y
        y += g.graph().nheight/2 + g.graph().nodesep
      })
      if(col.next){
        x += g.graph().layersep
      }
    }
  }
  g.graph().width = x + (g.graph().marginx||0)
  g.graph().height = height + (g.graph().marginy||0)
}

function order(g){
    // how much room a space has (range - num of nodes * nodespace)
    const room = s => s.nodes.reduce((sum,n) => sum+g.node(n).height,0) + (s.nodes.length-1)*g.graph().nodesep*2

}



function layout(g){
  createGroups.time(g)
  fixCycles.time(g)
  ranking.time(g)
  initialPositions.time(g)
}
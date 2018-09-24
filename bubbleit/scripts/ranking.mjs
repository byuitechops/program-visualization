/**
 * Fix Cycles
 * -------------
 * Any cycles in the graph will not only put many of the functions into infinite loops
 * but make it impossible to determine which column to put the nodes on. So to circumvent
 * this find the cycles in the graph and reverse one of the edges to break the cycle. This
 * process needs to be repeated until no cycles are found because there can
 * be cycles inside of cycles, so need to keep breaking them
 */
function fixCycles(g){
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
    },{rank:[0,0]})

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
  // for each component in our graph get the recursive rank function running
  var grid = [[{rank:[0,0],type:'root'}]]
  var components = graphlib.alg.components(g).sort((a,b) => b.length-a.length)
  components.forEach((component) => {
    rankNode(g,grid,component[0])
  })

  g.graph().columns = []
  for(var c = 0,ci=0; c < grid.length; c++){
    for(var l = 0; l < grid[c].length; l++){
      if(grid[c][l].type != 'root'){
        grid[c][l].ci = ci
        grid[c][l].grids = []
        grid[c][l].nodes.forEach(n => g.node(n).ci = ci)
        g.graph().columns.push(grid[c][l])
        ci++
      }
    }
  }
  
  g.graph().grids = components.map(() => ({nodes:[],columns:[]}))
  components.forEach((component,gi) => {
    component.sort().forEach(n => {
      if(!g.parent(n)){
        g.graph().grids[gi].nodes.push(n)

        let ci = g.node(n).ci
        if(g.graph().columns[ci].grids[gi] == undefined){
          g.graph().columns[ci].grids[gi] = {
            nodes:[],
            get(){return g.graph().grids[gi]}
          }
        }
        g.graph().columns[ci].grids[gi].nodes.push(n)
        
        if(g.graph().grids[gi].columns[ci] == undefined){
          g.graph().grids[gi].columns[ci] = {
            nodes:[],
            get(){return g.graph().columns[ci]}
          }
        }
        g.graph().grids[gi].columns[ci].nodes.push(n)
      }
    })
  })
}

export default function (g){
  fixCycles.time(g)
  ranking.time(g)
}
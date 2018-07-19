var graphlib = require('@dagrejs/graphlib')

function init(){
  var g = new graphlib.Graph()
  g.setDefaultNodeLabel(() => ({ rank:null }))
  g.setDefaultEdgeLabel(() => ({ reversed:false }))

  g.setNode(1);                                                           
  g.setNode(2);                                                           
  g.setNode(3);
  g.setNode(4);
  g.setNode(5);
  g.setNode(7);
  g.setNode(8);
  g.setEdge(1, 2);                                                        
  g.setEdge(2, 3);                                                        
  g.setEdge(3, 1);                                                                                                                                
  g.setEdge(4, 5);
  g.setEdge(2,5);
  g.setEdge(5,3);
  g.setEdge(7,8);

  return g
}

function fixCycles(g){
  do {
    var cycles = graphlib.alg.findCycles(g)
    cycles.forEach(cycle => {
      // find an edge in the cycle
      var v = cycle[0], w = g.successors(v).find(n => cycle.includes(n))
      var edge = g.edge(v,w)
      edge.reversed = true
      g.removeEdge(v,w)
      g.setEdge(w,v,edge)
    })
  } while(!graphlib.alg.isAcyclic(g))
}

function display(g){
  g.nodes().forEach(n => {
    console.log(n,g.node(n))
  })
  g.edges().forEach(({v,w}) => {
    console.log(v,'->',w,g.edge(v,w))
  })
}

function rank(g){
  // for each component in our graph get the recursive rank function running
  graphlib.alg.components(g).forEach(component => {
    rankNode(component[0])
  })

  function rankNode(n){
    var node = g.node(n)

    // this function may be called on nodes that already have a rank
    // but we will still need to check that all of our children have a rank
    if(node.rank == null){
      // get the ranks of our parents (recursing if they do not have a rank assigned yet)
      var parentRanks = g.predecessors(n).map(n => {
        var rank = g.node(n).rank
        return rank != null ? rank : rankNode(n)
      })
      // Give our node a rank of one more than our parent with the biggest rank
      if(parentRanks.length){
        node.rank = Math.max(...parentRanks) + 1
      } else {
        // it is a source node
        node.rank = 0
      }
    }
    
    // recurse for our children who do not have a rank yet
    g.successors(n).filter(n => g.node(n).rank == null).forEach(n => rankNode(n))

    return node.rank
  }
}

function addInBetweens(g){
  g.edges().forEach(({v,w}) => {
    var [from,to] = [g.node(v),g.node(w)]
    if(Math.abs(from.rank-to.rank) > 1){
      console.log('need inbetweens',v,w)
    }
  })
}

function main(){
  var g = init()
  fixCycles(g)
  rank(g)
  addInBetweens(g)
  display(g)
}

main()
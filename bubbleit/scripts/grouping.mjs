/**
* Grouping
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
function groupCourses(g,name,children,grouptype){
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
    level:0,
    isLogic:false,
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
export default function createGroups(g){
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
      groupCourses(g,children.join(' '),children,'concurrent')
    }
  })

  /* Create g.graph().groups */
  // Cache a list of groups created, sorted from lowest level to highest
  // just to that I don't have to do this expensive operation multiple times
  g.graph().groups = g.nodes()
    .filter(n => g.node(n).type=='group')
    .sort((a,b) => g.node(a).level-g.node(b).level)
}
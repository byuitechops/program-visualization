var dblcount = box.reduce((arr,n) => {
  arr.push(n)
  if(g.node(n).hasBridge) {
    arr.push(n)
    currentNumBreaks++
  }
  return arr
},[])
// set height to sum of nodes` height + padding for each node 
// (last node's padding accounts for the half on top and half on bottom)
box.height = dblcount.reduce((sum,n) => sum+g.node(n).height, dblcount.length*g.graph().nodesep)
// Set y to mean y of nodes
box.y = dblcount.reduce((sum,n) => sum+g.node(n).y,0)/dblcount.length


function fitBoxIntoGroups(g,groups,box){
  const hasCollision = (a,b) => a.y-a.height/2 < b.y+b.height/2 && a.y+a.height/2 > b.y-b.height/2
  const breaksize = 5
  // remove the group from the list, by moving the last element to the given index
  function remove(arr,i){
    var temp = arr[i]
    if(arr[i]){
      if(arr.length > 1){
        arr[i] = arr[arr.length-1]
      }
      --arr.length
    }
    return temp
  }

  /* Remove all the groups that have collisions */
  var collisions = []
  for(var i = 0; i < groups.length; i++){
    if(hasCollision(groups[i],box)){
      collisions.push(remove(groups,i--))
    }
  }
  
  /* If no collisions exit the loop */
  if(collisions.length == false){ 
    groups.push(box)
    return groups
  }

  /* Had collisions, merge them into one group */
  collisions.forEach(group => {
    box.push(...group)
  })

  // split box into groups of breaksize
  var split = []
  while(box.length) split.push(box.splice(0,breaksize))
  split.forEach((box,i) => {
    // set height to sum of nodes` height + padding for each node 
    // (last node's padding accounts for the half on top and half on bottom)
    box.height = box.reduce((sum,n) => sum+g.node(n).height, box.length*g.graph().nodesep)
    // Set y to mean y of nodes
    box.y = box.reduce((sum,n) => sum+g.node(n).y,0)/(box.length)
    // Give room from the spaces between the splits
    box.y += (i-(split.length-1)/2) * (g.graph().nheight + g.graph().nodesep*2)
    // This new height and y might trigger other collisions so we need to check again
    if(split.length > 1) debugger
    fitBoxIntoGroups(g,groups,box)
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

g.graph().getColumn = function(c,l){
  // saving the grid in this function
  // grid won't be accesable otherwise
  if(Array.isArray(c)) l = c[1], c = c[0]
  if(l == undefined) l = 0
  return grid[c] && grid[c][l]
}

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

g.graph().columns = []
g.graph().grids = []
for(var gi = 0; gi < grids.length; gi++){
  g.graph().grids[gi] = {columns:[]}
  var ci = 0
  for(var c = 0; c < grids[gi].length; c++){
    for(var l = 0; l < grids[gi][c].length; l++){
      if(grids[gi][c][l].type != 'root'){
        g.graph().columns[ci] = g.graph().columns[ci] || []
        grids[gi][c][l].ci = ci
        grids[gi][c][l].nodes.forEach(n => g.node(n).ci = ci)
        g.graph().columns[ci].push(grids[gi][c][l])
        g.graph().grids[gi].columns.push(grids[gi][c][l])
      }
      ci++
    }
  }
}

  // var cols = g.graph().columns.map((col,i) => ({
  //   y:g.graph().marginy||0,
  //   x:x += (!!i)*g.graph().layersep + (col.type=='course')*g.graph().nwidth,
  //   components:[]
  // }))
  // console.log(cols)
  // graphlib.alg.components(g).sort((a,b) => b.length-a.length).forEach(component => {
  //   component.forEach((n,i) => {
  //     if(!g.parent(n)){
  //       var col = cols[g.node(n).ci]
        
  //     }
  //   })
  //   component.forEach((n,i) => {
  //     if(!g.parent(n)){
  //       var node = g.node(n), col = cols[node.ci]
  //       col.y += g.node(n).height/2
  //       g.node(n).y = col.y
  //       col.y += g.node(n).height/2
  //       g.node(n).x = col.x
  //     }
  //   })
  // })
  // // maxheight = maxheight * 1.3
  // g.graph().columns.forEach((col,ci) => {
  //   var y = g.graph().marginy||0// + (maxheight-col.height)/2
  //   // padding between layers
  //   x += g.graph().layersep
  //   // account for node width (shouldn't vary between nodes)
  //   if(col.type == 'course') x += g.graph().nwidth
  //   /* debugging */col.x = x
  //   // set the node coordinates
  //   col.nodes.sort().forEach((n,i) => {
  //     g.node(n).x = x
  //     // account for spacing between nodes
  //     if(i != 0) y += (maxheight-col.height)/(col.nodes.length-1)
  //     // padded by node height
  //     y += g.node(n).height/2
  //     g.node(n).y = y
  //     y += g.node(n).height/2
  //   })
  // })
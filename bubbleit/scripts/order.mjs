const hasCollision = (a,b) => a.y-a.height/2 < b.y+b.height/2 && a.y+a.height/2 > b.y-b.height/2

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
function initialNodePositions(g){
  const spacing = g.graph().nodesep
  /* Calculate the height of each grid and column */
  g.graph().grids.forEach(grid => {
    grid.height = 0
    grid.columns.forEach(col => {
      col.height = 0
      col.nodes.forEach((n,ni) => col.height += g.node(n).height + !!ni*spacing)
      grid.height = Math.max(grid.height,col.height)
    })
  })

  /* Position the nodes */
  var x = g.graph().marginx||0
  g.graph().columns.forEach((col,ci) => {
    x += (col.type=='course')*g.graph().nwidth + !!ci*g.graph().layersep
    col.x = x
    col.grids.forEach(grid => {
      var y = 0
      grid.nodes.forEach((n,ni) => {
        /* Justify nodes horizontal position across grid height */
        if(grid.nodes.length == 1){
          y += (grid.get().height- g.node(n).height)/2
        } else if(ni){
          y += (grid.get().height-grid.get().columns[ci].height)/(grid.nodes.length-1)
        }
        y += g.node(n).height/2 + !!ni * spacing
        g.node(n).y = y
        y += g.node(n).height/2
        g.node(n).x = col.x
      })
    })
  })
  
  /* Progapate coordinates down to children */
  g.graph().groups.forEach(p => {
    g.children(p).forEach(n => {
      g.node(n).x = g.node(p).x
      g.node(n).y = g.node(p).y
    })
  })
}

function createBoxes(g){
  function calcPull(y){ 
    return this.pull = this.influences.reduce((sum,node) => sum+(node.y-y),0) 
  }
  function calcPosition(){
    var sum=0,totalweight=0,weight
    if(!this.influences.length) return this.node.y
    this.influences.forEach(node => {
      weight = 1//1/Math.abs(this.node.x-node.x)
      sum += node.y * weight
      totalweight += weight
    })
    this.id == '[MATH101 MATH110X]*' && console.log(this,this.influences.map(n => n.y))
    return this.y = sum/totalweight
  }
  function recursePreds(list,n){
    if(!list[n]){ // skip if already on list
      if(g.node(n).type == 'course') list[n] = g.node(n) // add to list
      else g.predecessors(n).reduce(recursePreds,list) // keep searching if not course
    }
    return list
  }
  function recurseSuccs(list,n){
    if(!list[n]){ // skip if already on list
      if(g.node(n).type == 'course') list[n] = g.node(n) // add to list
      else g.successors(n).reduce(recurseSuccs,list) // keep searching if not course
    }
    return list
  }
  function getInfluences(given){
    // const split = obj => ({keys:Object.keys(obj),values:Object.values(obj)})
    var preds = g.predecessors(given)
    var succs = g.successors(given)
    var cpreds = Object.values(preds.reduce(recursePreds,{}))
    var csuccs = Object.values(succs.reduce(recurseSuccs,{}))
    // bias logic nodes to one side if possible
    if(g.node(given).type == 'logic'){
      var rank = g.node(given).rank
      var succsNodes = succs.map(n => g.node(n)), 
        predsNodes = preds.map(n => g.node(n)), 
        canUseSuccs = false, 
        canUsePreds = false

      if(csuccs.length && csuccs.every(node => succsNodes.includes(node)) && csuccs.every(node => node.rank[0] == rank[0]+1)) canUseSuccs = true
      if(cpreds.length && cpreds.every(node => predsNodes.includes(node)) && cpreds.every(node => node.rank[0] == rank[0])) canUsePreds = true
      
      given == '[MATH101 MATH110X]*' && console.log(canUsePreds,canUseSuccs,cpreds.length,csuccs.length)
      if(canUsePreds && cpreds.length == 1) return cpreds
      if(canUseSuccs && csuccs.length == 1) return csuccs
      if(canUseSuccs && canUsePreds) return csuccs.length >= cpreds.length ? csuccs : cpreds
      else if(canUseSuccs) return csuccs
      else if(canUsePreds) return cpreds
    }
    return cpreds.concat(csuccs)
  }
  return g.graph().grids.map(grid => grid.columns.map(col => col.nodes.map(n => ({
    id:n,
    node:g.node(n),
    influences:getInfluences(n),
    calcPull,
    calcPosition,
  }))))
}

function placeBox(box,bubbles){
  /* Calculate where this box now wants to be */
  box.calcPosition()

  var currentbubble = Object.assign([box],{
    height:box.node.height+g.graph().nodesep,
    y:box.y,
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
    currentbubble.height = currentbubble.reduce((sum,box) => sum + box.node.height + g.graph().nodesep,0)
  }
  bubbles.push(currentbubble)

  return bubbles
}

function positionNodes(allBubbles){

  var offset = g.graph().marginy||0
  allBubbles.forEach(grid => {
    var max = null
    var min = null
    grid.forEach(col => col.forEach(bubble => {
      var top = bubble.y-bubble.height/2 + g.graph().nodesep/2
      var bottom = bubble.y+bubble.height/2 - g.graph().nodesep/2
      if(min == null || top < min) min = top
      if(max == null || bottom > max) max = bottom
    }))
    grid.forEach(col => col.forEach(bubble => {
      // Adjust column y for the grid offset
      bubble.y += offset-min
      // center nodes in the bubble (the subtract half nodesep)
      var y = bubble.y-bubble.height/2 + g.graph().nodesep/2
      bubble.forEach((box) => {
        y += box.node.height/2
        box.node.y = y
        g.children(box.id).forEach(n => g.node(n).y = y)
        y += box.node.height/2 + g.graph().nodesep
      })
    }))
    offset += max-min
  })
  g.graph().height = offset + (g.graph().marginy||0) + g.graph().nodesep

}

function* order(g){
  const boxes = createBoxes(g)
  console.log('boxes:',boxes)

  const allBubbles = boxes.map(grid => grid.map(() => []))
  /* debugging */window.allBubbles = allBubbles

  for(var round = 0; round < 50; round++){
    /* debugging */var nodes = []
    // TODO: There is probably be a good heuristic order in 
    // which to sort the nodes by (least amount of connections 
    // to greatest or something)
    for(var gi = 0; gi < boxes.length; gi++){
      for(var ci = 0; ci < boxes[gi].length; ci++){
        // skip columns that don't exist in this grid
        if(!boxes[gi][ci] 
          || g.graph().grids[gi].columns[ci].get().type == 'logic'
        ) continue; 
        // clear the previous existing bubbles
        allBubbles[gi][ci] = [] 
        for(var bi = 0; bi < boxes[gi][ci].length; bi++){
          // Place the box in the bubbles
          allBubbles[gi][ci] = placeBox(boxes[gi][ci][bi],allBubbles[gi][ci])
          // nodes.push(boxes[gi][ci][bi].id), yield nodes
        }
      }
      
      // TEMP: restructure to classes
      positionNodes(allBubbles)

      for(var ci = 0; ci < boxes[gi].length; ci++){
        // skip columns that don't exist in this grid
        if(!boxes[gi][ci] || g.graph().grids[gi].columns[ci].get().type == 'course') continue; 
        // clear the previous existing bubbles
        allBubbles[gi][ci] = [] 
        for(var bi = 0; bi < boxes[gi][ci].length; bi++){
          // Place the box in the bubbles
          allBubbles[gi][ci] = placeBox(boxes[gi][ci][bi],allBubbles[gi][ci])
          // nodes.push(boxes[gi][ci][bi].id), yield nodes
        }
      }
    }
    /* Set the node's new position */
    positionNodes(allBubbles)
    // yield
  }
}

export default function*(g){
  initialNodePositions.time(g)
  yield * order.time(g)
}
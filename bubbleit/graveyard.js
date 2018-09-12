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
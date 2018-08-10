g.nodes()
.forEach(n => {
  if(g.node(n).type == 'course'){
    g.predecessors(n).filter(pre => g.node(pre).type == 'course').forEach(pre => clone.setEdge(pre,n,{}))
    g.successors(n).filter(suc => g.node(suc).type == 'course').forEach(suc => clone.setEdge(n,suc,{}))
    clone.setNode(n,g.node(n))
  } else {
    g.predecessors(n).forEach(pre => g.successors(n).forEach(suc => clone.setEdge(pre,suc,{})))
  }
})

col.sort((a,b) => a.y-b.y).concat({y:g.graph().height}).reduce((last,n,ni) => {
  console.log(memory)
  memory.forEach((mem,mi) => {
    var i = ci-memory.length+mi
    var node = addNode(grid[i].x,n.y)
    r.setEdge(mem,node)
    if(mi && n.n){
      r.setEdge(memory[mi-1],node)
    }
    memory[mi] = node
  })
  if(n.n){
    r.setEdge(memory[memory.length-1],n.n,{},n.n)
  }
  // if(n.y-last > g.graph().nheight){
  // }
  return n.y
},0)
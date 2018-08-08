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
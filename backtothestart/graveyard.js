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

.attr('d',d => {
  var s = g.node(d.v)
  var t = g.node(d.w)
  // return describeLine(s.x,s.y,t.x,t.y)
  return [
    'M',s.x,s.y,
    'L',t.x-t.width,t.y,
  ].join(' ')
})

function routesrender(r){
  const $routes = svg.append('g')
  $routes.append('g').selectAll('line')
    .data(r.edges())
    .enter().append('line')
      // .attr('stroke-width',e => r.nodeEdges(e.v,e.w).length)
      .attr('stroke-opacity',e => e.name && r.edge(e.v,e.w,e.name) ? 0.5 : 0)
      .attr('stroke',e => e.name && r.edge(e.v,e.w,e.name) ? 'black' : 'red')
      .attr('x1',e => r.node(e.v).x)
      .attr('y1',e => r.node(e.v).y)
      .attr('x2',e => r.node(e.w).x)
      .attr('y2',e => r.node(e.w).y)
  // $routes.append('g').selectAll('circle')
  //   .data(r.nodes())
  //   .enter().append('circle')
  //     .attr('data-id',n => n)
  //     .attr('fill',n => ({route:'black',course:'red',logic:'red',mid:'purple'})[r.node(n).type])
  //     .attr('fill-opacity',n => r.node(n).type=='route' ? 1 : 1)
  //     .attr('r',n => r.node(n).type=='route' ? 2 : 2)
  //     .attr('cx',n => r.node(n).x)
  //     .attr('cy',n => r.node(n).y)
}
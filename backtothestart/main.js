const svg = d3.select('body').append('svg')
const $routes = svg.append('g').classed('routes',true)
const $edges = svg.append('g').classed('edges',true)
const $nodes = svg.append('g').classed('nodes',true)
const $groups = svg.append('g').classed('groups',true)

// Create the input graph
const g = dagre.graphlib.json.read(reqTree)
  .setGraph({
    rankdir:'LR',
    nodesep:5,
    edgesep:0,
    ranksep:20,
    marginx:50,
    nwidth:100,
    nheight:20,
    layersep:5,
    lanesep:3,
  })

// Some Graph Adjustments, mostly temporary
var comp = dagre.graphlib.alg.components(g).reduce((longest,n) => n.length>longest.length?n:longest)
g.nodes().filter(n => !comp.includes(n)).forEach(n => g.removeNode(n))
g.nodes().forEach(n => {
  var isCourse = g.node(n).type == 'course'
  g.node(n).width = g.graph().nwidth * isCourse
  g.node(n).height = g.graph().nheight * isCourse
})
g.removeNode('[]+')
g.removeNode('[]*')

const r = layout(g)
// render(clone)
render(g,r)
// routesrender(g,r)

function parents(n,highlight,first=true){
  d3.select(`[data-id="${n}"]`)
    .classed('highlight',highlight)
  if(first || g.node(n).type!='course'){
    d3.selectAll(`[data-target="${n}"]`)
      .classed('highlight',highlight)
    g.predecessors(n).forEach(n => parents(n,highlight,false))
  }
}
function children(n,highlight,first=true){
  d3.select(`[data-id="${n}"]`)
    .classed('highlight',highlight)
  if(first || g.node(n).type!='course'){
    d3.selectAll(`[data-source="${n}"]`)
      .classed('highlight',highlight)
    g.successors(n).forEach(n => children(n,highlight,false))
  }
}

function render(g){
  // Create Joined Data selections
  var _nodes = $nodes.selectAll('g')
    .data(g.nodes().filter(n => g.node(n).type!='group'),function(d){ return d ? d : this.getAttribute('data-id') })
  var _edges = $edges.selectAll('path')
    .data(g.edges(),function(d){ return d ? d.v+'-'+d.w : this.getAttribute('data-source')+'-'+this.getAttribute('data-target') })
  var _groups = $groups.selectAll('rect')
    .data(g.graph().groups,function(d){ return d ? d : this.getAttribute('data-id') })
    
  // Update elements with the new calculations
  var enteringNodes = _nodes.enter().append('g')
    .attr('data-id',n => n)
    .attr('data-type',n => g.node(n).type)
    .classed('disabled',n => g.predecessors(n).length)
    .on('mouseover',n => {parents(n,true);children(n,true)})
    .on('mouseout',n => {parents(n,false);children(n,false)})
  var courseNodes = enteringNodes.filter(n => g.node(n).type=='course' || g.node(n).type=='group')
  courseNodes.append('rect')
    .attr('width',n => g.node(n).width)
    .attr('height',n => g.node(n).height)
  courseNodes.append('text')
    .attr('x',n => g.node(n).width/2)
    .attr('y',n => g.node(n).height/2)
    .text(n => g.node(n).type=='course'?n:'')
  enteringNodes.filter(n => g.node(n).type!='course'&&g.node(n).type!='group').append('circle')
  enteringNodes.merge(_nodes)
    .attr('transform',n => {
      var node = g.node(n)
      return `translate(${[node.x-(node.width||0),node.y-(node.height||0)/2]})`
    })
  _nodes.exit().remove()

  _edges.enter().append('path')
    .attr('data-source',e => g.edge(e).v || e.v)
    .attr('data-target',e => g.edge(e).w || e.w)
    .attr('data-type',e => g.edge(e).type)
  .merge(_edges)
    .attr('d',e => {
      return g.edge(e).path.map(n => r.node(n).paths[g.edge(e).name]).map(({x,y},i) => (i?'L':'M')+x+','+y).join(' ')
      +'L'+(g.node(e.w).x-g.node(e.w).width||0)+','+g.node(e.w).y
    })
    .attr('x1',e => g.edge(e).x || g.node(e.v).x)
    .attr('y1',e => g.node(e.v).y)
    .attr('x2',e => g.edge(e).x || g.node(e.w).x-(g.node(e.w).width||0))
    .attr('y2',e => g.node(e.w).y)
  _edges.exit().remove()

  var thickness = 2.5
  _groups.enter().append('rect')
    .attr('data-id',n => n)
    .attr('data-type',n => g.node(n).type)
    .attr('data-grouptype',n => g.node(n).grouptype)
    .attr('stroke-width',thickness)
  .merge(_groups)
    .attr('x',n => g.node(n).x-g.graph().nwidth+thickness/2)
    .attr('y',n => g.node(n).y-g.node(n).height/2-thickness/2)
    .attr('width',n => g.node(n).width-thickness)
    .attr('height',n => g.node(n).height+thickness)
    .on('mouseover',n => {g.children(n).forEach(n => parents(n,true),children(n,true))})
    .on('mouseout',n => {g.children(n).forEach(n => parents(n,false),children(n,false))})
  _groups.exit().remove()

  svg
    .attr('width',g.graph().width)
    .attr('height',g.graph().height+g.graph().nodesep)
}

function routesrender(g,r){
  // r.nodes().filter(n => r.node(n).type=='exit').forEach(n => r.node(n).x+=3)
  $routes.append('g').selectAll('line')
    .data(r.edges())
    .enter().append('line')
      .attr('data-source',e => e.v)
      .attr('data-target',e => e.w)
      .attr('x1',e => r.node(e.v).x)
      .attr('y1',e => r.node(e.v).y)
      .attr('x2',e => r.node(e.w).x)
      .attr('y2',e => r.node(e.w).y)
  $routes.append('g').selectAll('circle')
    .data(r.nodes())
    .enter().append('circle')
      .attr('data-id',n => n)
      .attr('fill',n => ({route:'#CCC',course:'#00ffd0',logic:'red',bridge:'purple',exit:'none'})[r.node(n).type])
      .attr('r',n => ({route:2,exit:1})[r.node(n).type]||2)
      .attr('cx',n => r.node(n).x)
      .attr('cy',n => r.node(n).y)
  svg
    .attr('width',g.graph().width)
    .attr('height',g.graph().height)
}


// svg.append('g').selectAll('rect')
//   .data(Object.entries(spaces).reduce((arr,[x,spaces]) => arr.concat(spaces.map(n => (n.x=x,n))),[]))
//   .enter().append('line')
//   .attr('x1',d => d.x)
//   .attr('x2',d => d.x)
//   .attr('y1',d => d[0])
//   .attr('y2',d => d[1])
//   .attr('stroke','maroon')
//   .attr('stroke-width',10)
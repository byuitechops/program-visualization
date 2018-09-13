const svg = d3.select('body').append('svg')
const $routes = svg.append('g').classed('routes',true)
const $edges = svg.append('g').classed('edges',true)
const $highlight = svg.append('g').classed('highlighter',true)
const $nodes = svg.append('g').classed('nodes',true)
const $groups = svg.append('g').classed('groups',true)
const $debug1 = svg.append('g').classed('debug1',true)
const $debug2 = svg.append('g').classed('debug2',true)
const useTemporaryLines = true

const g = graphlib.json.read(reqTree)
  .setGraph({
    nwidth:100,
    nheight:20,
    nodesep:3,
    // marginx:50,
    layersep:useTemporaryLines ? 10 : 5,
    lanesep:3,
    andsep:1.5,
    height:window.innerHeight,
    width:window.innerWidth,
  })

// Some Graph Adjustments, mostly temporary
g.nodes().forEach(n => {
  var isCourse = g.node(n).type == 'course'
  g.node(n).width = g.graph().nwidth * isCourse
  // keep the height on logic nodes as padding in the algorithms
  g.node(n).height = g.graph().nheight
})

g.removeNode('[]+')
g.removeNode('[]*')

const color = colorfn(g)
{(async () => {
  for(var nodes of layout.time(g)){
    render(g,nodes)
    await new Promise(res => window.onclick = res)
    // await new Promise(res => setTimeout(res,100))
  }
  render(g)
})()}
// routesrender(g,r)
// updateStates(g)

function colorfn(g){
  var i = 0, colors = g.nodes().reduce((obj,n) => (g.node(n).program!=undefined && (obj[g.node(n).program] = obj[g.node(n).program] || i++),obj),{})
  return n => colors[n]!=undefined ? d3.interpolateRainbow(colors[n]/i-1) : '#999'
}

function predecessors(g,n,collection=[],first=true){
  collection.push(`[data-id="${n}"]`)
  if(first || g.node(n).type != 'course'){
    collection.push(...g.inEdges(n).map(e => `[data-source="${e.v}"][data-target="${e.w}"]`))
    g.predecessors(n).map(n => predecessors(g,n,collection,false))
  }
  return collection
}

function successors(g,n,collection=[],first=true){
  collection.push(`[data-id="${n}"]`)
  if(first || (g.node(n).type != 'course' && g.node(n).op != 'AND')){
    collection.push(...g.outEdges(n).map(e => `[data-source="${e.v}"][data-target="${e.w}"]`))
    g.successors(n).map(n => successors(g,n,collection,false))
  }
  return collection
}

function highlight(n,isOn){
  var _highlight = $highlight.selectAll('use')
  .data(isOn ? predecessors(g,n).concat(successors(g,n)) : [])
  _highlight.enter().append('use')
    .merge(_highlight)
    .each((sel,i) => d3.select(sel).classed('highlight',true).attr('id','use_'+i))
    .attr('href',(e,i) => '#use_'+i)
  _highlight.exit()
    .each(sel => d3.select(sel).classed('highlight',false).attr('id',undefined))
    .remove()
}

function updateStates(g){
  var checked = {}
  g.nodes().forEach(function check(n){
    if(checked[n]) return;
    var logic = [g.node(n).op=='OR'?'some':'every']
    g.node(n).enabled = g.predecessors(n)[logic](n => {
      !checked[n] && check(n)
      return g.node(n).type=='course'?g.node(n).active:g.node(n).enabled
    })
    var state
    // If enabled, keep active state, or set to enabled. Otherwise disable
    if(g.node(n).enabled){
      if(g.node(n).type != 'course'){
        g.node(n).active = true
      }
      state = g.node(n).active ? 'active' : 'enabled'
    } else {
      g.node(n).active = false
      state = 'disabled'
    }
    var succs = g.outEdges(n).map(e => `[data-source="${e.v}"][data-target="${e.w}"]`).concat(`[data-id="${n}"]`)
    succs.forEach(sel => d3.select(sel).attr('data-state',state))
    checked[n] = true
  })
}

function render(g,nodes){
  g.nodes().forEach(n => (g.node(n).y=g.node(n).y||0,g.node(n).x=g.node(n).x||0))
  nodes = nodes || g.nodes().filter(n => g.node(n).type!='group')
  // Create Joined Data selections
  var _nodes = $nodes.selectAll('g')
    .data(nodes,function(d){ return d ? d : this.id})
  var _edges = $edges.selectAll('line')
    .data(g.edges(),function(d){ return d ? d.v+'-'+d.w : this.getAttribute('data-source')+'-'+this.getAttribute('data-target') })
  var _groups = $groups.selectAll('rect')
    .data(g.graph().groups.filter(n => g.node(n)),function(d){ return d ? d : this.id })

  // Update elements with the new calculations
  var enteringNodes = _nodes.enter().append('g')
    .attr('id',n => n)
    .attr('data-type',n => g.node(n).op || g.node(n).type)
    .on('mouseover',n => highlight(n,true))
    .on('mouseout',n =>  highlight(n,false))
    .on('click',n => g.node(n).enabled && (g.node(n).active = !g.node(n).active,updateStates(g,n)))
  var courseNodes = enteringNodes.filter(n => g.node(n).type=='course' || g.node(n).type=='group')
  courseNodes.append('rect')
    .attr('width',n => g.node(n).width)
    .attr('height',n => g.node(n).height)
    .attr('fill',n => color(g.node(n).program))
  courseNodes.append('text')
    .attr('x',n => g.node(n).width/2)
    .attr('y',n => g.node(n).height/2)
    .text(n => g.node(n).type=='course'?n:'')
  courseNodes.append('line')
    .attr('x1',0)
    .attr('y1',n => g.node(n).height-1.5)
    .attr('x2',n => g.node(n).width)
    .attr('y2',n => g.node(n).height-1.5)
    .attr('stroke',n => color(g.node(n).program))
  enteringNodes.filter(n => g.node(n).type!='course'&&g.node(n).type!='group').append('circle')
  function transform(n){
    var node = g.node(n)
    var isCourse = node.type != 'logic'
    return `translate(${[node.x-(node.width*isCourse),node.y-(node.height/2*isCourse)]})`
  }
  enteringNodes.merge(_nodes)
    .attr('transform',transform)
  _nodes.exit().remove()

  var entering = _edges.enter().append(useTemporaryLines ? 'line' : 'path')
    .attr('data-source',e => e.v)
    .attr('data-target',e => e.w)
    .attr('data-type',e => g.edge(e).type)
  if(useTemporaryLines){ // For debugging
    entering.merge(_edges)
      .attr('x1',e => g.edge(e).x || g.node(e.v).x)
      .attr('y1',e => g.node(e.v).y)
      .attr('x2',e => g.edge(e).x || g.node(e.w).x-(g.node(e.w).width||0) || 0)
      .attr('y2',e => g.node(e.w).y)
  } else {
    entering.merge(_edges)
      .attr('d',e => {
        // console.log(g.edge(e).path,g.edge(e).name)
        return g.edge(e).path.map(n => r.node(n).paths[g.edge(e).name]).map(({x,y},i) => (i?'L':'M')+x+','+y).join(' ')
        // +'L'+(g.node(e.w).x-g.node(e.w).width||0)+','+g.node(e.w).y
      })
      // .attr('stroke-width', e => g.edge(e).width)
  }
  _edges.exit().remove()

  var thickness = 1.5
  _groups.enter().append('rect')
    .attr('id',n => n)
    .attr('data-type',n => g.node(n).type)
    .attr('data-grouptype',n => g.node(n).grouptype)
    .attr('stroke-width',thickness)
  .merge(_groups)
    .attr('x',n => g.node(n).x-g.graph().nwidth+thickness/2)
    .attr('y',n => g.node(n).y-g.node(n).height/2-thickness/2)
    .attr('width',n => g.graph().nwidth-thickness)
    .attr('height',n => g.node(n).height+thickness)
  _groups.exit().remove()

  svg
    .attr('width',g.graph().width)
    .attr('height',g.graph().height+g.graph().nodesep)

  /* Debugging for ordering algorithm */
  var _boxes = $debug2.selectAll('line')
    .data([].concat(...window.boxes).filter(n => n))
  _boxes.enter().append('line')
    .merge(_boxes)
    .attr('x1',d => d.x-g.graph().nwidth*(d.type=='course'))
    .attr('x2',d => d.x)
    .attr('y1',d => d.y1 = Math.min(...d.map(n => g.node(n).y-g.node(n).height/2)))
    .attr('y2',d => d.y2 = Math.max(...d.map(n => g.node(n).y+g.node(n).height/2)))
    .attr('stroke','#f442e8')
    .attr('stroke-width',2)
  _boxes.exit().remove()
  // var groups = [].concat(...g.graph().columns.filter(col => col.groups).map(col => col.groups.map(group => (group.x=col.x,group.type=col.type,group))))
  var _groups = $debug1.selectAll('line')
    .data(window.boxes.filter(n => n))
  _groups.enter().append('line')
    .merge(_groups)
    .attr('x1',d => d.x)
    .attr('x2',d => d.x-g.graph().nwidth*(d.type=='course'))
    .attr('y1',d => Math.min(...d.map(n => n.y1)))
    .attr('y2',d => Math.max(...d.map(n => n.y2)))
    // .attr('y1',d => d.y-d.height/2)
    // .attr('y2',d => d.y+d.height/2)
    .attr('stroke','maroon')
    .attr('stroke-width',2)
  _groups.exit().remove()
  // var boxes = g.graph().columns.filter(col => col.groups).reduce((arr,col) => (col.groups.forEach(group => group.forEach(box => {
  //   arr.push({
  //     y:box.reduce((sum,n) => sum+g.node(n).y,0)/box.length,
  //     height:box.reduce((sum,n) => sum+g.node(n).height,box.length*g.graph().nodesep),
  //     x:col.x,
  //     type:col.type,
  //   })
  // })),arr),[])

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
const svg = d3.select('body').append('svg')
const $routes = svg.append('g').classed('routes',true)
const $edges = svg.append('g').classed('edges',true)
const $highlight = svg.append('g').classed('highlighter',true)
const $nodes = svg.append('g').classed('nodes',true)
const $groups = svg.append('g').classed('groups',true)

const useTemporaryLines = true

// Create the input graph
const g = dagre.graphlib.json.read(reqTree)
  .setGraph({
    rankdir:'LR',
    nodesep:3,
    edgesep:0,
    ranksep:useTemporaryLines ? 20 : 20,
    marginx:50,
    nwidth:100,
    nheight:20,
    layersep:useTemporaryLines ? 10 : 5,
    lanesep:3,
    andsep:1.5,
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

const color = (() => {
  var i = 0, colors = g.nodes().reduce((obj,n) => (g.node(n).program!=undefined && (obj[g.node(n).program] = obj[g.node(n).program] || i++),obj),{})
  return n => colors[n]!=undefined ? d3.interpolateRainbow(colors[n]/i-1) : '#999'
})()
const r = layout.time(g)
// render(clone)
render(g,r)
// routesrender(g,r)
updateStates(g)

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

function render(g){
  g.nodes().forEach(n => (g.node(n).y=g.node(n).y||0,g.node(n).x=g.node(n).x||0))
  // Create Joined Data selections
  var _nodes = $nodes.selectAll('g')
    .data(g.nodes().filter(n => g.node(n).type!='group'),function(d){ return d ? d : this.getAttribute('data-id') })
  var _edges = $edges.selectAll('path')
    .data(g.edges(),function(d){ return d ? d.v+'-'+d.w : this.getAttribute('data-source')+'-'+this.getAttribute('data-target') })
  var _groups = $groups.selectAll('rect')
    .data(g.graph().groups.filter(n => g.node(n)),function(d){ return d ? d : this.getAttribute('data-id') })

  // Update elements with the new calculations
  var enteringNodes = _nodes.enter().append('g')
    .attr('data-id',n => n)
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
  enteringNodes.merge(_nodes)
    .attr('transform',n => {
      var node = g.node(n)
      return `translate(${[node.x-(node.width||0),node.y-(node.height||0)/2]})`
    })
  _nodes.exit().remove()

  var entering = _edges.enter().append(useTemporaryLines ? 'line' : 'path')
    .attr('data-source',e => g.edge(e).v || e.v)
    .attr('data-target',e => g.edge(e).w || e.w)
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
    .attr('data-id',n => n)
    .attr('data-type',n => g.node(n).type)
    .attr('data-grouptype',n => g.node(n).grouptype)
    .attr('stroke-width',thickness)
  .merge(_groups)
    .attr('x',n => g.node(n).x-g.graph().nwidth+thickness/2)
    .attr('y',n => g.node(n).y-g.node(n).height/2-thickness/2)
    .attr('width',n => g.node(n).width-thickness)
    .attr('height',n => g.node(n).height+thickness)
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

/* Debugging for 'fixLeafNodes' */
svg.append('g').selectAll('rect')
  .data(Object.entries(columnSpaces).reduce((arr,[col,spaces]) => arr.concat(spaces.map(n => (n.x=g.graph().columns[col].x,n))),[]))
  .enter().append('line')
  .attr('x1',d => d.x)
  .attr('x2',d => d.x)
  .attr('y1',d => d.from)
  .attr('y2',d => d.to)
  .attr('stroke','maroon')
  .attr('stroke-width',10)
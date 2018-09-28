/* !NOTE: Functions who don't need direct access to the svg containers are place outside the renderer class */
function createColorFn(g){
  var i = 0, colors = g.nodes().reduce((obj,n) => (g.node(n).program!=undefined && (obj[g.node(n).program] = obj[g.node(n).program] || i++),obj),{})
  return n => colors[n]!=undefined ? d3.interpolateRainbow(colors[n]/i-1) : '#999'
}

function search(g,n,searchDown,collection,first=true){
  collection = collection || {courses:[],edges:[],logics:[]}

  if(g.node(n).type == 'logic') collection.logics.push(`[data-id="${n}"]`)
  else if(!first) collection.courses.push(`[data-id="${n}"]`)

  if(first || g.node(n).type != 'course'){
    collection.edges.push(...g[searchDown ? 'outEdges' : 'inEdges'](n).map(e => `[data-source="${e.v}"][data-target="${e.w}"]`))
    g[searchDown ? 'successors' : 'predecessors'](n).map(n => search(g,n,searchDown,collection,false))
  }

  return collection
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

export default class Renderer {
  constructor(svg){
    this.svg = svg//d3.select(svg)
    this.$debug = this.svg.append('g').classed('debug',true)
    this.$edges = this.svg.append('g').classed('edges',true)
    this.$nodes = this.svg.append('g').classed('nodes',true)
    this.$highlight = this.svg.append('g').classed('highlighter',true)
    this.$highlight.append('g').classed('courses',true)
    this.$highlight.append('g').classed('edges',true)
    this.$highlight.append('g').classed('logics',true)
    this.$groups = this.svg.append('g').classed('groups',true)
  }

  highlight(g,n,isOn){
    this.$nodes.classed('dim',isOn)
    this.$edges.classed('dim',isOn)
    d3.select(`[data-id="${n}"]`).classed('highlight',isOn)

    var highlighties = search(g,n,true)
    search(g,n,false,highlighties)

    var _highlight = this.$highlight.selectAll('use')
      .data(isOn ? [].concat(highlighties.courses,highlighties.edges,highlighties.logics) : [])
    
    _highlight.enter().append('use')
      .merge(_highlight)
      .each((sel,i) => d3.select(sel).classed('highlight',true).attr('id','use_'+i))
      .attr('href',(e,i) => '#use_'+i)
    _highlight.exit()
      .each(sel => d3.select(sel).classed('highlight',false).attr('id',undefined))
      .remove()
  }

  renderNodes(g,nodes){
    nodes = nodes || g.nodes().filter(n => g.node(n).type!='group').filter(n => !isNaN(g.node(n).x) && !isNaN(g.node(n).y))
    var _nodes = this.$nodes.selectAll('g')
      .data(nodes,function(d){ return d ? d : this.id})
  
    /* Create the new nodes */
    var enteringNodes = _nodes.enter().append('g')
      .attr('data-id',n => n)
      .attr('data-type',n => g.node(n).op || g.node(n).type)
      .on('mouseover',n => this.highlight(g,n,true))
      .on('mouseout',n =>  this.highlight(g,n,false))
      .on('click',n => g.node(n).enabled && (g.node(n).active = !g.node(n).active,updateStates(g,n)))
  
    /* New course Nodes */
    var courseNodes = enteringNodes.filter(n => isCourse(g,n))
    courseNodes.append('rect')
      .attr('width',n => g.node(n).width)
      .attr('height',n => g.node(n).height)
      .attr('fill',n => this.color(g.node(n).program))
    courseNodes.append('text')
      .attr('x',n => g.node(n).width/2)
      .attr('y',n => g.node(n).height/2)
      .text(n => g.node(n).type=='course'?n:'')
    courseNodes.append('line')
      .attr('x1',0)
      .attr('y1',n => g.node(n).height+g.graph().nodesep/2)
      .attr('x2',n => g.node(n).width)
      .attr('y2',n => g.node(n).height+g.graph().nodesep/2)
      .attr('stroke-width',g.graph().nodesep)
      .attr('stroke','white')
    // courseNodes.append('line')
    //   .attr('x1',0)
    //   .attr('y1',n => g.node(n).height-1.5)
    //   .attr('x2',n => g.node(n).width)
    //   .attr('y2',n => g.node(n).height-1.5)
    //   .attr('stroke',n => this.color(g.node(n).program))
  
    /* New logic Nodes */
    enteringNodes.filter(n => !isCourse(g,n))
      .append('circle')
  
    /* Update existing and created nodes */
    enteringNodes.merge(_nodes)
      .attr('transform',n =>{
        var node = g.node(n),useSize = isCourse(g,node)
        return `translate(${[node.x-node.width*useSize,node.y-node.height/2*useSize]})`
      })
  
    /* Remove exiting nodes */
    _nodes.exit().remove()
  }
  renderEdges(g){
    /* Match up existing edges based on thier source and target ids */
    var _edges = this.$edges.selectAll('line')
      .data(g.edges(),function(d){ 
        return d ? d.v+'-'+d.w : this.getAttribute('data-source')+'-'+this.getAttribute('data-target') 
      })
    
    /* Create new Edges */
    _edges.enter().append('line')
      .attr('data-source',e => e.v)
      .attr('data-target',e => e.w)
      .attr('data-type',e => g.edge(e).type)
    /* Update existing and created edges */
      .merge(_edges)
      .attr('x1',e => g.edge(e).x || g.node(e.v).x)
      .attr('y1',e => g.node(e.v).y)
      .attr('x2',e => g.edge(e).x || g.node(e.w).x-(g.node(e.w).width||0) || 0)
      .attr('y2',e => g.node(e.w).y)
    /* Remove exiting edges */
    _edges.exit().remove()
  }
  renderGroups(g){
    var _groups = this.$groups.selectAll('rect')
      .data(g.graph().groups.filter(n => g.node(n)),function(d){ return d ? d : this.id })

    var thickness = 1.5
    /* Create new Groups */
    _groups.enter().append('rect')
      .attr('data-id',n => n)
      .attr('data-type',n => g.node(n).type)
      .attr('data-grouptype',n => g.node(n).grouptype)
      .attr('stroke-width',thickness)
    /* Update existing and created groups */
      .merge(_groups)
      .attr('x',n => g.node(n).x-g.graph().nwidth+thickness/2)
      .attr('y',n => g.node(n).y-g.node(n).height/2-thickness/2)
      .attr('width',n => g.graph().nwidth-thickness)
      .attr('height',n => g.node(n).height+thickness)
    /* Remove exiting groups */
    _groups.exit().remove()
  }
  debugBubbles(g){
    var bubbles = allBubbles.reduce((arr,grid,gi) => (grid.forEach((col,ci) => col.forEach(bubble => {
      arr.push(Object.assign({},bubble,g.graph().grids[gi].columns[ci].get()))
    })),arr),[])
    var _bubbles = this.$debug.selectAll('line')
      .data([].concat(...bubbles).filter(n => n))
    _bubbles.enter().append('line')
      .merge(_bubbles)
      .attr('x1',d => d.x-g.graph().nwidth*isCourse(g,d))
      .attr('x2',d => d.x)
      .attr('y1',d => d.y-d.height/2)
      .attr('y2',d => d.y+d.height/2)
      .attr('stroke','maroon')
      .attr('stroke-width',2)
    _bubbles.exit().remove()
  }
  render(g,nodes){
    this.color = createColorFn(g)

    this.renderNodes(g,nodes)
    this.renderEdges(g)
    this.renderGroups(g)
    // this.debugBubbles(g)
    // updateStates(g)
    
    /* Update SVG size */
    this.svg
      .attr('width',g.graph().width)
      .attr('height',g.graph().height+g.graph().nodesep)
  }
}
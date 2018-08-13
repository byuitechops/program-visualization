const svg = d3.select('body').append('svg')
const $nodes = svg.append('g').classed('nodes',true)
const $edges = svg.append('g').classed('edges',true)

// Create the input graph
const g = dagre.graphlib.json.read(reqTree)
  .setGraph({
    rankdir:'LR',
    nodesep:5,
    edgesep:0,
    ranksep:50,
    marginx:50,
    nwidth:100,
    nheight:20,
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

layout(g)
render(g)

function render(g){
  // Create Joined Data selections
  var _nodes = $nodes.selectAll('g')
    .data(g.nodes(),function(d){ return d ? d : this.getAttribute('data-id') })
  var _edges = $edges.selectAll('path')
    .data(g.edges(),function(d){ return d ? d.v+'-'+d.w : this.getAttribute('data-source')+'-'+this.getAttribute('data-target') })

  // Update elements with the new calculations
  var enteringNodes = _nodes.enter()
    .filter(n => g.graph(n).type=='course').append('g')
    .attr('data-id',d => d)
    .attr('data-type',d => g.node(d).type)
  enteringNodes.append('rect')
    .attr('width',d => g.node(d).width)
    .attr('height',d => g.node(d).height)
  enteringNodes.append('text')
    .attr('x',d => g.node(d).width/2)
    .attr('y',d => g.node(d).height/2)
    .text(d => g.node(d).type == 'course' ? d : '')
  enteringNodes
    .merge(_nodes)
      .attr('transform',d => `translate(${[g.node(d).x-g.node(d).width,g.node(d).y-g.node(d).height/2]})`)
  _nodes.exit().remove()

  _edges.enter().append('path')
    .attr('data-source',d => d.v)
    .attr('data-target',d => d.w)
    .attr('data-type',d => g.edge(d.v,d.w).type)
  .merge(_edges)
    .attr('d',d => {
      var s = g.node(d.v)
      var t = g.node(d.w)
      // return describeLine(s.x,s.y,t.x,t.y)
      return [
        'M',s.x,s.y,
        'L',t.x-t.width,t.y,
      ].join(' ')
    })
  _edges.exit().remove()

  svg
    .attr('width',g.graph().width)
    .attr('height',g.graph().height)
}
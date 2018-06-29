const svg = d3.select('body').append('svg')

let Graph = createGraph()

const g = svg.append('g')
const $nodes = g.append('g').classed('nodes',true)
const $edges = g.append('g').classed('edges',true)

function createGraph(){
  let g = dagre.graphlib.json.read(reqTree);
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({rankdir:'RL',ranker:'longest-path'})
  g.nodes().forEach(n => {
    var node = g.node(n)
    g.setNode(n,Object.assign({width:100*(node.type=='course'),height:30*(node.type=='course')},node))
  })
  g.edges().forEach(e => g.setEdge(e.v,e.w,g.edge(e)))
  return g
}

function update(){
  // Create Joined Data selections
  var _nodes = $nodes.selectAll('g')
    .data(Graph.nodes(),function(d){ return d ? d : this.getAttribute('data-id') })
  var _edges = $edges.selectAll('path')
    .data(Graph.edges(),function(d){ return d ? d.v+'-'+d.w : this.getAttribute('data-source')+'-'+this.getAttribute('data-target') })

  // Calculate positions
  dagre.layout(Graph);
  
  // Update elements with the new calculations
  var enteringNodes = _nodes.enter().append('g')
    .attr('data-id',d => d)
  enteringNodes.append('rect')
    .attr('width',d => Graph.node(d).width)
    .attr('height',d => Graph.node(d).height)
  enteringNodes.append('text')
    .attr('x',d => Graph.node(d).width/2)
    .attr('y',d => Graph.node(d).height/2)
    .text(d => Graph.node(d).type == 'course' ? d : '')
  enteringNodes
  .merge(_nodes)
    .attr('transform',d => `translate(${[Graph.node(d).x-Graph.node(d).width/2,Graph.node(d).y-Graph.node(d).height/2]})`)
    .on('mouseover', function(d){
      d3.select(this).classed('highlight',true)
    })
    .on('mouseout', function(d){
      d3.select(this).classed('highlight',false)
    })
  _nodes.exit().remove() 

  _edges.enter().append('path')
    .attr('data-source',d => d.v)
    .attr('data-target',d => d.w)
  .merge(_edges)
    .attr('d',d => {
      var s = Graph.node(d.w)
      var t = Graph.node(d.v)
      return describeLine(s.x+s.width/2,s.y,t.x-t.width/2,t.y)
    })
  _edges.exit().remove() 

  svg
    .attr('width',Graph.graph().width)
    .attr('height',Graph.graph().height)
}

update()


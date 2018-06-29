const svg = d3.select('body').append('svg')

let Graph = createGraph(Nodes,Edges)

const g = svg.append('g')
const $nodes = g.append('g').classed('nodes',true)
const $edges = g.append('g').classed('edges',true)

function createGraph(nodeData,edgeData){
  let g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({rankdir:'LR'})
  nodeData.forEach(n => g.setNode(n.id,Object.assign({width:100,height:30},n)))
  edgeData.forEach(n => g.setEdge(n.source,n.target,n))
  return g
}

function update(){
  // Create Joined Data selections
  var _nodes = $nodes.selectAll('g')
    .data(Graph.nodes().map(n => Graph.node(n)),
      function(d){ return d ? d.id : this.getAttribute('data-id') })
  var _edges = $edges.selectAll('path')
    .data(Graph.edges().map(n => Graph.edge(n)),
      function(d){ return d ? d.source+'-'+d.target : this.getAttribute('data-source')+'-'+this.getAttribute('data-target') })

  // Calculate positions
  dagre.layout(Graph);
  
  // Update elements with the new calculations
  var enteringNodes = _nodes.enter().append('g')
      .attr('data-id',d => d.id)
  enteringNodes.append('rect')
    .attr('width',d => d.width)
    .attr('height',d => d.height)
  enteringNodes.append('text')
    .attr('x',d => d.width/2)
    .attr('y',d => d.height/2)
    .text(d => d.label)
  enteringNodes
    .merge(_nodes)
      .attr('transform',d => `translate(${[d.x-d.width/2,d.y-d.height/2]})`)
      .on('mouseover', function(d){
        d3.select(this).classed('highlight',true)
      })
      .on('mouseout', function(d){
        d3.select(this).classed('highlight',false)
      })
  _nodes.exit().remove() 

  _edges.enter().append('path')
      .attr('data-source',d => d.source)
      .attr('data-target',d => d.target)
    .merge(_edges)
      .attr('d',d => {
        var s = Graph.node(d.source)
        var t = Graph.node(d.target)
        return describeLine(s.x+s.width/2,s.y,t.x-t.width/2,t.y)
      })
  _edges.exit().remove() 

  svg
    .attr('width',Graph.graph().width)
    .attr('height',Graph.graph().height)
}

update()


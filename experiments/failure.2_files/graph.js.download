const svg = d3.select('body').append('svg')

let Graph = createGraph()

const g = svg.append('g')
const $nodes = g.append('g').classed('nodes',true)
const $edges = g.append('g').classed('edges',true)

function createGraph(){
  let g = graphlib.json.read(reqTree);
  let levels = ranking(g)
  console.log(levels)
  var x = 100
  var offsetY = 100
  var height = 0
  levels.forEach(level => {
    level.forEach(logic => {
      logic.forEach((n,i) => {
        if(n == undefined) return;
        var node = g.node(n)
        node.width = 70*(node.type=='course')
        node.height = 10*(node.type=='course')
        node.x = x
        node.y = offsetY + i*40
        height = Math.max(height,node.y)
      })
      x+= 70
    })
    x += 20
  })
  g.setGraph({
    width:x+100,
    height:height+100
  })
  return g
}

function update(){
  // Create Joined Data selections
  var _nodes = $nodes.selectAll('g')
    .data(Graph.nodes(),function(d){ return d ? d : this.getAttribute('data-id') })
  var _edges = $edges.selectAll('path')
    .data(Graph.edges(),function(d){ return d ? d.v+'-'+d.w : this.getAttribute('data-source')+'-'+this.getAttribute('data-target') })
  
  // Update elements with the new calculations
  var enteringNodes = _nodes.enter().append('g')
    .attr('data-id',d => d)
  enteringNodes.append('rect')
    .attr('width',d => Graph.node(d).width)
    .attr('height',d => Graph.node(d).height)
  // enteringNodes.append('text')
  //   .attr('x',d => Graph.node(d).width/2)
  //   .attr('y',d => Graph.node(d).height/2)
  //   .text(d => Graph.node(d).type == 'course' ? d : '')
  enteringNodes
  .merge(_nodes)
    .attr('transform',d => `translate(${[Graph.node(d).x-Graph.node(d).width,Graph.node(d).y-Graph.node(d).height/2]})`)
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
      var s = Graph.node(d.v)
      var t = Graph.node(d.w)
      // return describeLine(s.x,s.y,t.x,t.y)
      return [
        'M',s.x,s.y,
        'L',t.x-t.width,t.y,
      ].join(' ')
    })
  _edges.exit().remove()

  svg
    .attr('width',Graph.graph().width)
    .attr('height',Graph.graph().height)
}

update()


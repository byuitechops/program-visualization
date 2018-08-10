const width = window.innerWidth
const height = window.innerHeight
const svg = d3.select('body').append('svg')
.attr('width',width)
.attr('height',height)

const graph = generateGraph(8,100,200)

const simulation = d3.forceSimulation()
  .force('collide', d3.forceCollide().radius(10))
  .force('link',d3.forceLink().id(d => d.id).strength(2))
  // .force('charge', d3.forceManyBody().strength(0.01))
  .force('center', d3.forceCenter(width / 2, height / 2));

const _links = svg.append('g')
    .attr('class','links')
  .selectAll('line')
  .data(graph.links)
  .enter().append('line')

const _nodes = svg.append('g')
    .attr('class','nodes')
    .selectAll('circle')
    .data(graph.nodes)
    .enter().append('circle')
      .attr('r',5)

simulation
  .nodes(graph.nodes)
  .on('tick',() => {
    _links
      .attr('x1',d =>  d.source.x)
      .attr('y1',d =>  d.source.y)
      .attr('x2',d =>  d.target.x)
      .attr('y2',d =>  d.target.y)

    _nodes
      .attr('cx',d => d.x)
      .attr('cy',d => d.y)
  })

simulation.force('link').links(graph.links)

function generateGraph(levelCount,nodeCount,linkCount){
  var levels = Array(levelCount).fill().map(() => Array())
  for(var i = 0; i < nodeCount; i++){
    var level = Math.floor(Math.random()*levelCount)
    levels[level].push({
      id:i,
      fx:(width-(levelCount*100))/2 + level*100
    })
  }
  var links = Array(linkCount).fill().map(() => {
    var level = Math.floor(Math.random()*(levelCount-1))
    return {
      source:levels[level][Math.floor(Math.random()*levels[level].length)].id,
      target:levels[level+1][Math.floor(Math.random()*levels[level+1].length)].id
    }
  })
  return {
    nodes:[].concat(...levels),
    links:links,
  }
}
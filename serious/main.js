import * as d3 from 'd3'
import * as graphlib from '@dagrejs/graphlib'
import reqTree from './req-tree.json'
import ranking from './ranking'

const svg = d3.select('body').append('svg')

let Graph = graphlib.json.read(reqTree);

let width=window.innerWidth,height=1000

const g = svg.append('g')
const $nodes = g.append('g').classed('nodes',true)
const $edges = g.append('g').classed('edges',true)

function setNodes(levels){
  var x = 100
  var offsetY = 100
  levels.forEach(level => {
    level.forEach(logic => {
      logic.forEach((n,i) => {
        if(n == undefined) return;
        var node = Graph.node(n)
        node.fx = x
        node.x = x
        node.y = offsetY + i*25
        height = Math.max(height,node.y)
      })
      x+= 50
    })
    x += 100
  })
  width = Math.max(width,x+100)
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
  enteringNodes.append('text')
    .attr('x',d => Graph.node(d).width/2)
    .attr('y',d => Graph.node(d).height/2)
    .text(d => Graph.node(d).type == 'course' ? d : '')
  enteringNodes
  .merge(_nodes)
    .attr('transform',d => `translate(${[Graph.node(d).x-Graph.node(d).width,Graph.node(d).y-Graph.node(d).height/2]})`)
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
    .attr('width',width)
    .attr('height',height)
}

function generate(str,connections){
  let g = new graphlib.Graph()
  g.setDefaultNodeLabel(() => ({ rank:null, type:'course'}))
  str.trim().split('\n').forEach((row,r,rows) => {
    row.trim().replace(/\s+/g,'').split('').forEach((n) => {
      if(g.node(n) == undefined){
        g.setNode(n)
      }
    })
  })
  connections.trim().split('\n').forEach((row,r,rows) => {
    var [v,w] = row.trim().split(/\W+/)
    g.setEdge(v,w)
  })
  return g
}

async function main(){
  // Graph = generate(`
  // A
  // B C D E
  // FGH I J
  // `,`
  // A -> B
  // A -> C
  // A -> D
  // A -> E
  // B -> F
  // B -> G
  // B -> H
  // C -> I
  // E -> J
  // E -> F
  // `)
  // var levels = ranking(Graph)
  // console.log(levels)
  // setNodes(levels)
  Graph.nodes().forEach(n => {
    var node = Graph.node(n)
    node.id = n
    node.width = 100*(node.type=='course')
    node.height = 20*(node.type=='course')
    node.x = 0
    node.y = 0
  })
  update()
  // for(let levels of ){
  //   await new Promise(res => window.onclick = res)
  // }
  const simulation = d3.forceSimulation()
    .force('link',d3.forceLink().id(d => d.id))
    .force('collide',d3.forceCollide().radius(d => d.type=='course'?40:10))
    .force('center',d3.forceCenter(width/2,height/2))
    .nodes(Graph.nodes().map(n => Graph.node(n)))

  simulation.force('link')
    .links(Graph.edges().map(({v,w}) => ({source:v,target:w})))
  
  var nodes = $nodes.selectAll('g')
    .data(Graph.nodes(),function(d){ return d ? d : this.getAttribute('data-id') })
  var edges = $edges.selectAll('path')
    .data(Graph.edges(),function(d){ return d ? d.v+'-'+d.w : this.getAttribute('data-source')+'-'+this.getAttribute('data-target') })
    
  simulation.on('tick',() => {
    nodes.attr('transform',d => {
      var node = Graph.node(d)
      return `translate(${[Graph.node(d).x-Graph.node(d).width/2,Graph.node(d).y-Graph.node(d).height/2]})`
    })
    edges.attr('d',d => {
      var s = Graph.node(d.v)
      var t = Graph.node(d.w)
      return [
        'M',s.x,s.y,
        'L',t.x,t.y,
      ].join(' ')
    })
  })
  window.Graph = Graph
  window.simulation = simulation
}

main()
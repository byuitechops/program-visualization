import reqTree from './req-tree.mjs' /* data */
import layout from './scripts/layout.mjs' /* algorithm */
import Renderer from './scripts/render.mjs' /* display */

const g = window.g = graphlib.json.read(reqTree)
  .setGraph({
    nwidth:100,
    nheight:20,
    nodesep:3,
    // marginx:50,
    layersep:20,
    lanesep:3,
    andsep:1.5,
    height:window.innerHeight,
    width:window.innerWidth,
  })

// Some Graph Adjustments, mostly temporary
g.nodes().forEach(n => {
  g.node(n).width = g.graph().nwidth * isCourse(g,n)
  // keep the height on logic nodes as padding in the algorithms
  g.node(n).height = g.graph().nheight
})

g.removeNode('[]+')
g.removeNode('[]*')

const svg = d3.select('body').append('svg')
const controller = new Renderer(svg)

/* Step through */
{(async () => {
  for(var nodes of layout.time(g)){
    controller.render(g,nodes)
    await new Promise(res => window.onclick = res)
    // await new Promise(res => setTimeout(res,100))
  }
  controller.render(g)
})()}
// /* Run */
// layout.time(g)
// controller.render(g)
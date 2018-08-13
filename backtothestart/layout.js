function createGroups(g){
  // TODO: Look into using tarjan instead of findCycles
  dagre.graphlib.alg.findCycles(g).forEach(cycle => {
    var isgroup = cycle.every(n => g.nodeEdges(n)
                          .filter(e => cycle.includes(e.v) && cycle.includes(e.w))
                          .every(e => g.edge(e).type == 'concur'))
    if(isgroup){
      // remove the logic nodes
      var children = cycle.filter(n => {
        if(g.node(n).type == 'logic'){
          g.removeNode(n)
          return false
        }
        return true
      })
      var name = '{'+children.join(' ')+'}'
      g.setNode(name,{
        type:'group',
        width:g.graph().nwidth,
        height:children.length*g.graph().nheight+(children.length-1)*g.graph().nodesep
      })
      children.forEach(child => g.setParent(child,name))
    }
  })
}

function positionLogics(g){
  var slots = []

  function ranker(n){
    if(g.node(n).type == 'logic' && g.node(n).x == undefined){
      var farthest = g.predecessors(n).reduce((max,n) => Math.max(max,g.node(n).x != undefined ? g.node(n).x : ranker(n)),0)
      g.node(n).x = farthest+1
      var li = farthest%g.graph().ranksep, sx = farthest-li
      slots[sx] = slots[sx] || []
      slots[sx][li] = slots[sx][li] || []
      slots[sx][li].push(n)
    }
    return g.node(n).x || 0
  }
  function y(n){
    return g.node(n).y!=undefined?g.node(n).y:y(g.parent(n))
  }
  g.nodes().forEach(ranker)
  slots.forEach((levels,sx) => {
    levels.forEach((level,li) => {
      level.forEach(n => {
        g.node(n).x = sx+10*(li+1)
        var pres = g.predecessors(n)
        g.node(n).y = pres.map(y).reduce((a,b) => a+b,0)/pres.length
      })
    })
  })
}

function positionGroups(g){
  g.nodes().filter(n => g.node(n).type == 'group').forEach(parent => {
    var children = g.children(parent).map(n => ({n}))
    children.forEach(p => {
      var neighbors = g.neighbors(p.n)
      p.i = neighbors.reduce((sum,n) => sum+g.node(n).y-g.node(parent).y,0)
    })
    children.sort((a,b) => a.i-b.i)
    children.forEach((p,i) => {
      g.node(p.n).x = g.node(parent).x
      g.node(p.n).y = g.node(parent).y-g.node(parent).height/2+g.node(p.n).height/2+i*(g.graph().nheight+g.graph().nodesep)
    })
  })
}

function adjustLogics(g){
  g.nodes().filter(n => g.node(n).type == 'logic').forEach(n => {
    var neighbors = g.neighbors(n)
    g.node(n).y = neighbors.reduce((sum,n) => sum+g.node(n).y,0)/neighbors.length
  })
}

function rundagre(g){
  function addEdge(v,w){
    if(clone.edge(v,w)==undefined){
      clone.setEdge(v,w,{weight:1})
    } else {
      clone.edge(v,w).weight++
    }
  }
  // Copy Graph cause I only want the dagre layout algorithm to run on the courses not the logics
  // So that also means that I need to replace the logic edges with edges connected to the courses
  var clone = new dagre.graphlib.Graph()
  clone.setGraph(g.graph())
  g.nodes().forEach(n => clone.setNode(n,g.node(n)))
  g.edges().forEach(({v,w}) => clone.setEdge(v,w,g.edge(v,w)))
  // Make changes
  g.nodes().filter(n => g.node(n).type=='logic').forEach(n => {
    var edges = clone.nodeEdges(n)
    // Left commented, cause I will probably want to play with the weights more, with different graphs
      // console.log(edges)
      // var weight = edges.reduce((sum,{v,w}) => sum+(clone.edge(v,w).weight||1),0)/(edges.length-1)
      // console.log(weight,n)
    clone.predecessors(n).forEach(pre => clone.successors(n).forEach(suc => clone.setEdge(pre,suc,{})))
    clone.removeNode(n)
  })
  g.nodes().filter(n => g.node(n).type=='group').forEach(n => {
    g.children(n).forEach(child => {
      clone.inEdges(child).forEach(({v,w}) => addEdge(v,n))
      clone.outEdges(child).forEach(({v,w}) => addEdge(n,w))
      clone.removeNode(child)
    })
  })
  // layout the clone
  dagre.layout(clone)
}

function findPaths(g){
  // copy this graph
  var rgraph = ngraph.graph()
  g.nodes().filter(n => g.node(n).type!='group').forEach(n => rgraph.addNode(n))
  g.edges().filter(e => g.edge(e).type=='route').forEach(e => rgraph.addLink(e.v,e.w))
  var current, none = {weight:Number.POSITIVE_INFINITY}
  var PathFinder = ngraph.path.nba(rgraph,{
    distance(v,w,l){
      return (r.edge(v.id,w.id) || r.edge(v.id,w.id,current) || none).weight
    }
  })
  g.edges().forEach(e => {
    current = e.v
    g.edge(e).path = PathFinder.find(e.w,e.v).map(n => n.id)
    g.edge(e).path.reduce((v,w) => {
      if(!r.edge(v,w,current)){
        r.setEdge(v,w,r.edge(v,w),current)
      }
      return w
    })
  })
}

function addRouting(g){
  function addNode(x,y){
    var n = x+','+y
    g.setNode(n,{type:'route',x:x,y:y})
    return n
  }
  function addEdge(p1,p2,name){
    g.setEdge(p1,p2,{
      weight:Math.abs(g.node(p1).x-g.node(p2).x)+Math.abs(g.node(p1).y-g.node(p2).y),
      type:'route',
    },name)
  }

  // Create list of nodes sorted top to bottom
  var nodes = g.nodes()
    .filter(n => g.node(n).type != 'group')
    .map(n => ({n,...g.node(n)}))
    .sort((a,b) => a.y-b.y)

  // Add in the 'mid' nodes
  var lasts = {}
  nodes.forEach(node => {
    lasts[node.x] = lasts[node.x] || {node}
    if(node.y-lasts[node.x].y>g.graph().nheight*2 && node.type=='course'){
      var mid = {
        y:(node.y+lasts[node.x].y)/2,
        x:node.x,
        n:node.n+'~'+lasts[node.x].n,
        type:'mid',
      }
      nodes.push(mid)
      g.setNode(mid.n,mid)
    }
    lasts[node.x] = node
  },{})

  // Need to sort again cause the mid nodes are all at the back
  // TODO: splice in the nodes where they fit in as it is going along
  nodes.sort((a,b) => a.y-b.y)

  // Used to know the x and type of each column
  var grid = Object.values(lasts).sort((a,b) => a.x-b.x)
  window.grid = grid

  var memory = []
  grid.forEach((col,ci) => {
    if(col.type=='course' && memory.length){
      /* Node connections */
      nodes.filter(node => node.x >= grid[ci-memory.length-1].x && node.x <= col.x).forEach((node,ni) => {
        if(ni == 0){
          memory = memory.map(x => addNode(x,node.y))
        }
        for(var mi = 0,created,i; mi < memory.length; ++mi){
          i = ci-memory.length+mi
          created = grid[i].x == node.x ? node.n : addNode(grid[i].x,node.y)
          addEdge(memory[mi],created)
          mi && addEdge(memory[mi-1],created,memory[mi-1]==node.n?node.n:undefined)
          memory[mi] = created
        }
        // Front node connections
        if(grid[ci-memory.length-1].x == node.x){
          addEdge(node.n,memory[0],node.type=="mid"?undefined:node.n)
        }
        // Back node connections
        if(grid[ci].x == node.x){
          addEdge(memory[memory.length-1],node.n)
        }
      })
      memory = []
      last = 0
    } else if(col.type=='logic'){
      memory.push(col.x)
    }
  })
}

function layout(g){
  rundagre(g)
  positionLogics(g)
  positionGroups(g)
  adjustLogics(g)
  addRouting(g)
  findPaths(g)
  // render(clone)
}
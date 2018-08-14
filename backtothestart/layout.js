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
      var weight = edges.reduce((sum,{v,w}) => sum+(clone.edge(v,w).weight||1),0)/(edges.length-1)
      // console.log(weight,n)
    clone.predecessors(n).forEach(pre => clone.successors(n).forEach(suc => clone.setEdge(pre,suc,{weight})))
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
        g.node(n).x = sx+g.graph().layersep*(li+1)
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

function addRouting(g){
  const r = new dagre.graphlib.Graph({directed:false})
  r.setGraph({})
  g.nodes().filter(n => g.node(n).type!='group').forEach(n => {
    var rnode = addNode(g.node(n).x,g.node(n).y)
    g.node(n).exit = rnode
    r.node(rnode).name = n
    r.node(rnode).type = g.node(n).type
  })
  window.r = r

  function addNode(x,y){
    var n = Math.round(x)+','+Math.round(y)
    if(r.node(n)!==undefined) return n;
    r.setNode(n,{x:x,y:y,type:'route',paths:{}})
    return n
  }
  function addEdge(p1,p2){
    if(p1 == p2) return;
    r.setEdge(p1,p2,{weight:Math.abs(r.node(p1).x-r.node(p2).x)+Math.abs(r.node(p1).y-r.node(p2).y)})
  }

  // Create list of nodes sorted top to bottom
  var nodes = r.nodes()
    .map(n => ({n,...r.node(n)}))
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
        type:'bridge',
        paths:{},
      }
      nodes.push(mid)
      r.setNode(mid.n,mid)
    }
    lasts[node.x] = node
  },{})

  // Need to sort again cause the mid nodes are all at the back
  // TODO: splice in the nodes where they fit in as it is going along
  nodes.sort((a,b) => a.y-b.y)

  // Used to know the x and type of each column
  var grid = Object.values(lasts).sort((a,b) => a.x-b.x)

  // Inject the extra logic layers
  for(var i = 0; i < grid.length-1; i++){
    if(grid[i].type =='logic' && grid[i+1].type =='course'){
      grid.splice(i+1,0,{x:grid[i].x+g.graph().layersep,type:'logic'})
      i++
    }
  }
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
          if(mi!=0){
            if(r.node(memory[mi-1]).name!==undefined){
              if(memory[mi-1]==node.n){
                g.node(node.name).enter = created
              }
            } else {
              addEdge(memory[mi-1],created)
            }
          }
          memory[mi] = created
        }
        // Front node connections
        if(grid[ci-memory.length-1].x == node.x){
          if(node.type == 'bridge'){
            addEdge(node.n,memory[0])
          } else {
            g.node(node.name).enter = memory[0]
          }
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
  return r
}

function findPaths(g,r){
  // copy the graph
  var rgraph = ngraph.graph()
  r.nodes().forEach(n => rgraph.addNode(n))
  r.edges().forEach(e => rgraph.addLink(e.v,e.w))
  var PathFinder = ngraph.path.nba(rgraph,{
    distance(v,w){
      return r.edge(v.id,w.id).weight
    }
  })
  g.edges().forEach(e => { 
    var name = g.edge(e).name = e.v+'.'+g.edge(e).type
    g.edge(e).path = PathFinder.find(g.node(e.w).exit,g.node(e.v).enter).map(n => n.id)
    g.edge(e).path.forEach(n => {
      if(!r.node(n).paths[name]){
        r.node(n).paths[name] = {
          x:r.node(n).x,
          y:r.node(n).y,
        }
      }
    })
  })
  // Clean out everything that didn't get used
  r.nodes().filter(n => r.node(n).type != 'course' && Object.keys(r.node(n).paths).length==0).forEach(n => r.removeNode(n))
}


function adjustColSpacing(g,r){
  var cols = r.nodes().reduce((cols,n) => {
    var col = cols[r.node(n).x] = cols[r.node(n).x] || {type:r.node(n).type,nodes:[],paths:{},numLayer:0}
    col.nodes.push(n)
    Object.keys(r.node(n).paths).forEach(name => {
      var path = col.paths[name] = col.paths[name] || {min:g.graph().height,max:0}
      path.min = Math.min(path.min,r.node(n).y)
      path.max = Math.max(path.max,r.node(n).y)
      path.span = path.max-path.min
    })
    return cols
  },{})
  window.cols = cols
  Object.values(cols).filter(col => col.type!='course').forEach(col => {
    Object.values(col.paths).sort((a,b) => a.span-b.span).reduce((slots,path) => {
      var j = 0
      // while there are collisions, move to the next layer
      while(slots[j].some(existing => existing.min <= path.max && existing.max >= path.min)){
        ++j
        slots[j] = slots[j] || []
      }
      slots[j].push(path)
      path.layer = j
      col.numLayer = Math.max(col.numLayer,path.layer+1)
      return slots
    },[[]])
  })
  var x = g.graph().marginx || 0
  Object.entries(cols).sort((a,b) => a[0]-b[0]).map(n => n[1]).forEach((col,ci,arr) => {
    if(col.type=='course'){
      if(ci && arr[ci-1].type!='course'){
        x += g.graph().ranksep/2
      }
      x += g.graph().nwidth
      col.nodes.forEach((n,i) => {
        r.node(n).x = x
        if(r.node(n).name){
          g.node(r.node(n).name).x = x
        }
        Object.keys(r.node(n).paths).forEach(name => {
          r.node(n).paths[name].x = x
        })
      })
      x += g.graph().ranksep/2
    } else {
      x += g.graph().layersep * col.numLayer
      col.nodes.forEach(n => {
        r.node(n).x = x
        if(r.node(n).name){
          g.node(r.node(n).name).x = x
        }
        Object.keys(r.node(n).paths).forEach(name => {
          r.node(n).paths[name].x = x - (g.graph().layersep * (col.paths[name].layer+1))
        })
      })
      x += g.graph().layersep
    }
  })
  g.graph().width = x
}

function layout(g){
  createGroups(g)
  rundagre(g)
  positionLogics(g)
  positionGroups(g)
  adjustLogics(g)
  const r = addRouting(g)
  findPaths(g,r)
  adjustColSpacing(g,r)
  return r
}
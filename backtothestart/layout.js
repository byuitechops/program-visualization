function createGroups(g){
  function group(name,children){
    name = '{'+name+'}'
    g.setNode(name,{
      type:'group',
      width:g.graph().nwidth,
      height:children.length*g.graph().nheight+(children.length-1)*g.graph().nodesep
    })
    children.forEach(child => g.setParent(child,name))
  }

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
      // group(children.join(' '),children)
    }
  })

  Object.entries(g.nodes().filter(n => g.node(n).type == 'course').reduce((parents,n) => {
    var parent = g.predecessors(n)
    if(parent.length==1){
      parents[parent[0]] = parents[parent[0]] || []
      parents[parent[0]].push(n)
    }
    return parents
  },{})).forEach(([n,children]) => {
    if(children.length > 1){
      group(n,children)
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
    clone.predecessors(n).forEach(pre => clone.successors(n).forEach(suc => clone.setEdge(pre,suc,{})))
    clone.removeNode(n)
  })
  var groups = g.nodes().filter(n => g.node(n).type=='group')
  groups.forEach(n => {
    g.children(n).forEach(child => {
      clone.inEdges(child).forEach(({v,w}) => addEdge(v,n))
      clone.outEdges(child).forEach(({v,w}) => addEdge(n,w))
      clone.removeNode(child)
    })
  })
  // One way to fix it, going to try something else tho
  // g.sinks().filter(n => !g.parent(n) && g.node(n).type == 'course' && g.predecessors(n).length == 1).forEach(n => {
  //   clone.inEdges(n).forEach(e => clone.edge(e).weight = 1.3)
  // })
  window.clone = clone
  // layout the clone
  dagre.layout(clone)

  groups.forEach(n => {
    g.children(n).forEach(child => {
      g.node(child).x = g.node(n).x
      // temporary positions
      g.node(child).y = g.node(n).y
    })
  })
}

function adjustLeafs(g){
  function parents(n,first=true){
    if(!first && g.node(n).type == 'course'){
      return g.node(n)
    } else {
      return [].concat(...g.predecessors(n).map(n => parents(n,false)))
    }
  }
  const spaceheight = g.graph().nheight+g.graph().nodesep*2
  const split = (space,i,node) => space.splice(i,1,[space[i][0],node.y-(node.height/2)],[node.y+(node.height/2),space[i][1]])
  var leafs = g.sinks().filter(n => !g.parent(n) && g.node(n).type == 'course' && g.predecessors(n).length == 1)
  var spaces = g.nodes().filter(n => g.node(n).type=='group' || g.node(n).type=='course' && !g.parent(n)).reduce((cols,n) => {
    var node = g.node(n)
    cols[node.x] = cols[node.x] || [[0,g.graph().height]]
    if(!leafs.includes(n)){
      var i = cols[g.node(n).x].findIndex(([from,to]) => from < node.y && node.y < to)
      if(i != -1){
        split(cols[g.node(n).x],i,node)
      }
    }
    return cols
  },{})
  window.spaces = spaces
  console.log(spaces)
  leafs.forEach(n => {
    var node = g.node(n)
    var p = parents(n)
    var [sum,totalweight] = p.reduce(([sum,totalweight],parent) => {
      var weight = (g.graph().nwidth+g.graph().ranksep)/(node.x-parent.x)
      return [sum+parent.y*weight,totalweight+=weight]
    },[0,0])
    var mean = sum/totalweight
    for(var i=0,closesti,closestdist; i < spaces[node.x].length; i++){
      var space = spaces[node.x][i]
      if(space[1]-space[0]>spaceheight){
        var dist = Math.min(...space.map(y => Math.abs(mean-y)))
        if(closesti===undefined || dist < closestdist){
          closesti = i
          closestdist = dist
        }
      }
    }
    console.log(n,closesti,spaces[node.x][closesti])
    var closest = spaces[node.x][closesti]
    mean = Math.max(mean,closest[0]+spaceheight/2)
    mean = Math.min(mean,closest[1]-spaceheight/2)
    node.y = mean
    split(spaces[node.x],closesti,node)
    // space.splice(i,1,[space[i][0],node.y-(node.height/2)],[node.y+(node.height/2),space[i][1]])
    // closest[0]
    // node.y = mean
  })
}

function positionLogics(g){
  var slots = []
  g.nodes().forEach(function ranker(n){
    if(g.node(n).type == 'logic' && g.node(n).x == undefined){
      var farthest = g.predecessors(n).reduce((max,n) => Math.max(max,g.node(n).x != undefined ? g.node(n).x : ranker(n)),0)
      g.node(n).x = farthest+1
      var li = farthest%g.graph().ranksep, sx = farthest-li
      slots[sx] = slots[sx] || []
      slots[sx][li] = slots[sx][li] || []
      slots[sx][li].push(n)
    }
    return g.node(n).x || 0
  })
  slots.forEach((levels,sx) => {
    levels.forEach((level,li) => {
      level.forEach(n => {
        g.node(n).x = sx+g.graph().layersep*(li+1)
        var pres = g.predecessors(n)
        // temporary position y
        g.node(n).y = pres.map(n => g.node(n).y).reduce((a,b) => a+b,0)/pres.length
      })
    })
  })
}

function createGrid(g){
  var grid = g.nodes().reduce((cols,n) => {
    cols[g.node(n).x] = cols[g.node(n).x] || {x:g.node(n).x,type:g.node(n).type,nodes:[]}
    cols[g.node(n).x].nodes.push(n)
    return cols
  },{})
  grid = Object.entries(grid).sort((a,b) => a[0]-b[0]).map(a => a[1])
  // Inject the extra logic layers
  for(var i = 0; i < grid.length-1; i++){
    if(grid[i].type =='logic' && grid[i+1].type =='course'){
      grid.splice(i+1,0,{x:grid[i].x+g.graph().layersep,type:'logic',nodes:[]})
      i++
    }
  }
  g.graph().grid = grid
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
  var cols = g.graph().grid.filter(col => col.type == 'course')
  g.nodes().forEach(n => {
    if(g.node(n).type == 'logic'){
      var ci = cols.findIndex(col => g.node(n).x < col.x)
      var pre = g.predecessors(n).filter(n => cols[ci-1].x <= g.node(n).x)
      var suc = g.successors(n).filter(n => g.node(n).x <= cols[ci].x)
      var cpre = pre.filter(n => g.node(n).type == 'course')
      var csuc = suc.filter(n => g.node(n).type == 'course')
      if(csuc.length && csuc.length == suc.length){
        g.node(n).y = csuc.reduce((sum,n) => sum+g.node(n).y,0)/csuc.length
      } else if(cpre.length && cpre.length == pre.length){
        g.node(n).y = cpre.reduce((sum,n) => sum+g.node(n).y,0)/cpre.length
      } else {
        g.node(n).y = pre.concat(suc).reduce((sum,n) => sum+g.node(n).y,0)/(pre.length+suc.length)
      }
    } else if(g.node(n).type == 'course'){
      lastCourseX = g.node(n).x
    }
  })
}

function addBridges(nodes,r){
  const slotsize = r.graph().nheight+r.graph().nodesep
  const cols = r.graph().grid.filter(col => col.type=='course')
  function createBridge(x,y,n){
    var mid = {
      x:x,y:y,n:n,
      type:'bridge',
      paths:{},
    }
    nodes.push(mid)
    r.setNode(mid.n,mid)
  }
  // Add in the 'mid' nodes
  nodes.filter(n => n.type == 'course')
    .concat(cols.map(col => ({x:col.x,y:r.graph().height,n:'bottom'})))
    .reduce((lasts,node) => {
      var count = (node.y-lasts[node.x].y)/slotsize
      if(count > 1){
        createBridge(node.x,(node.y+lasts[node.x].y)/2,node.n+'~'+lasts[node.x].n)
        if(count > 3){
          createBridge(node.x,node.y-slotsize,node.n+'~')
          createBridge(node.x,lasts[node.x].y+slotsize,'~'+lasts[node.x].n)
        }
      }
      lasts[node.x] = node
      return lasts
  },cols.reduce((lasts,col) => (lasts[col.x]={x:col.x,y:0,n:'top'},lasts),{}))
}

function addRouting(g){
  const r = new dagre.graphlib.Graph({directed:false})
  r.setGraph(g.graph())
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

  addBridges(nodes,r)

  // Need to sort again cause the mid nodes are all at the back
  // TODO: splice in the nodes where they fit in as it is going along
  nodes.sort((a,b) => a.y-b.y)

  // Used to know the x and type of each column
  var grid = r.graph().grid
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
  adjustLeafs(g)
  positionLogics(g)
  createGrid(g)
  positionGroups(g)
  adjustLogics(g)
  const r = addRouting(g)
  findPaths(g,r)
  adjustColSpacing(g,r)
  return r
}
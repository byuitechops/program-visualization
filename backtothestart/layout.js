function setEdgeThickness(g){
  g.nodes().forEach(n => {
    // g.node(n).op=="AND" && (g.node(n).op="OR")
    var numLines = g.node(n).op=="AND" ? g.predecessors(n).length : 1
    g.outEdges(n).forEach(e => g.edge(e).numLines = numLines)
  })
}

function group(name,children,grouptype){
  var checked = []
  function top(n){
    if(g.parent(n) && !checked.includes(g.parent(n))){
      // checks to make sure that the entire group is a sub group
      if(!g.children(g.parent(n)).every(child => children.includes(child))){
        throw new Error('Trying to create super group which does not contain all children')
      } else {
        g.node(g.parent(n)).level++
        checked.push(g.parent(n))
      }
    }
    return g.parent(n) ? top(g.parent(n)) : n
  }
  name = '{'+name+'}'
  g.setNode(name,{
    type:'group',
    grouptype:grouptype,
    width:g.graph().nwidth,
    height:children.reduce((sum,n) => sum+g.node(n).height,0)+(children.length-1)*g.graph().nodesep*(grouptype=='same parent'),
    coursechildren:children,
    level:0
  })
  children.map(child => top(child)).forEach(child => g.setParent(child,name))
}

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
      group(children.join(' '),children,'concurrent')
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
      group(n,children,'same parent')
    }
  })

  g.graph().groups = g.nodes().filter(n => g.node(n).type=='group').sort((a,b) => g.node(a).level-g.node(b).level)
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
  g.graph().groups.forEach(n => {
    g.children(n).forEach(child => {
      clone.inEdges(child).forEach(({v,w}) => addEdge(v,n))
      clone.outEdges(child).forEach(({v,w}) => addEdge(n,w))
      clone.removeNode(child)
    })
  })
  window.clone = clone
  // layout the clone
  dagre.layout(clone)
}

function orderGroupChildren(g){
  // Temporarily assign the group children the same coordinates as their parents
  g.graph().groups.forEach(parent => {
    g.children(parent).forEach(child => {
      g.node(child).x = g.node(parent).x
      g.node(child).y = g.node(parent).y
    })
  })
  g.graph().groups.forEach(parent => {
    g.children(parent).map(n => {
      var i = findCourses(g,n,n => g.successors(n)).reduce((sum,n) => sum+(g.node(n).y-g.node(parent).y),0)
      return {n,i}
    })
    .sort((a,b) => a.i-b.i)
    .reduce((y,{n}) => {
      g.node(n).y = y+g.node(n).height/2
      return y+g.node(n).height+g.graph().nodesep*(g.node(parent).grouptype=='same parent')
    },g.node(parent).y-g.node(parent).height/2)
  })
}

function fixLeafNodes(g){
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
  leafs.forEach(n => {
    var node = g.node(n)
    var parents = findCourses(g,n,n => g.predecessors(n)).map(p => g.node(p))
    var [sum,totalweight] = parents.reduce(([sum,totalweight],parent) => {
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
    var closest = spaces[node.x][closesti]
    mean = Math.max(mean,closest[0]+spaceheight/2)
    mean = Math.min(mean,closest[1]-spaceheight/2)
    node.y = mean
    split(spaces[node.x],closesti,node)
  })
}

function positionLogicsInLevels(g){
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
      })
    })
  })
}

function compileGrid(g){
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

function adjustLogics(g){
  var cols = g.graph().grid.filter(col => col.type == 'course')
  var nodes = g.nodes().filter(n => g.node(n).type == 'logic')
  var next = []
  while(nodes.length){
    nodes.forEach(n => {
      var ci = cols.findIndex(col => g.node(n).x < col.x)
      var pre = g.predecessors(n).filter(n => cols[ci-1].x <= g.node(n).x)
      var suc = g.successors(n).filter(n => g.node(n).x <= cols[ci].x)
      var cpre = pre.filter(n => g.node(n).type == 'course')
      var csuc = suc.filter(n => g.node(n).type == 'course')
      if(csuc.length && csuc.length == suc.length){
        g.node(n).y = csuc.reduce((sum,n) => sum+g.node(n).y,0)/csuc.length
      } else if(cpre.length && cpre.length == pre.length){
        g.node(n).y = cpre.reduce((sum,n) => sum+g.node(n).y,0)/cpre.length
      } else if(pre.every(n => !isNaN(g.node(n).y)) && suc.every(n => !isNaN(g.node(n).y))){
        g.node(n).y = pre.concat(suc).reduce((sum,n) => sum+g.node(n).y,0)/(pre.length+suc.length)
      } else {
        next.push(n)
      }
    })
    nodes = next.slice()
    next = []
  }
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
    .concat(cols.map(col => ({x:col.x,y:r.graph().height+g.graph().nheight/2+r.graph().nodesep,n:col.x+'.bottom'})))
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
  },cols.reduce((lasts,col) => (lasts[col.x]={x:col.x,y:-g.graph().nheight/2-r.graph().nodesep,n:col.x+'.top'},lasts),{}))

  // Need to sort again cause the mid nodes are all at the back
  // TODO: splice in the nodes where they fit in as it is going along
  nodes.sort((a,b) => a.y-b.y)
}

function addRouting(g){
  function addNode(x,y,isExit){
    var n = Math.round(x)+','+Math.round(y)+(isExit?'.exit':'')
    if(r.node(n)!==undefined) return n;
    r.setNode(n,{x:x,y:y,type:isExit?'exit':'route',paths:{}})
    return n
  }
  function addEdge(p1,p2){
    if(p1 == p2) return;
    if(!r.node(p1)){ throw new Error(p1+' doesn\'t exist')}
    if(!r.node(p2)){ throw new Error(p2+' doesn\'t exist')}
    r.setEdge(p1,p2,{weight:Math.abs(r.node(p1).x-r.node(p2).x)+Math.abs(r.node(p1).y-r.node(p2).y)})
  }
  
  const r = new dagre.graphlib.Graph({directed:false})
  r.setGraph(g.graph())
  g.nodes().filter(n => g.node(n).type!='group').forEach(n => {
    var rnode = addNode(g.node(n).x,g.node(n).y)
    r.node(rnode).name = n
    r.node(rnode).type = g.node(n).type
    g.node(n).enter = rnode
    var exit = r.node(rnode).exit = g.node(n).exit = addNode(g.node(n).x,g.node(n).y,true)
    r.node(exit).name = n
  })
  window.r = r

  // Create list of nodes sorted top to bottom
  var nodes = r.nodes()
    .map(n => ({n,...r.node(n)}))
    .sort((a,b) => a.y-b.y)

  addBridges(nodes,r)

  var memory = []
  r.graph().grid.forEach((col,ci) => {
    if(col.type=='course' && memory.length){
      /* Node connections */
      nodes.filter(node => !node.type != 'exit' && node.x >= r.graph().grid[ci-memory.length-1].x && node.x <= col.x).forEach((node,ni) => {
        // var back = r.graph().grid[ci-memory.length-1].x == node.x ? node.n : null
        var back = r.graph().grid[ci-memory.length-1].x == node.x ? (node.type=='bridge'?node.n:node.exit) : null
        // var front = node.n
        var front = r.graph().grid[ci-memory.length-1].x != node.x ? node.n : null
        var x = mi => r.graph().grid[ci-memory.length+mi].x
        var getmi = x => r.graph().grid.findIndex(col=>col.x==x)-(ci-memory.length)
        memory = memory.map((mem,mi) => {
          created = addNode(x(mi),node.y)
          ni && addEdge(memory[mi],created)
          return created
        })
        for(let mi = getmi(node.x)+1; mi < memory.length; mi++){
          // connect to back
          addEdge(node.exit||node.n,memory[mi])
          if(r.node(memory[mi]).name) break;
        }
        if(node.type != 'exit'){
          for(let mi = getmi(node.x)-1; mi >= 0 && !r.node(memory[mi]).name; mi--){
            // connect to front
            addEdge(memory[mi],node.n)
          }
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
  r.nodes().forEach(n => rgraph.addNode(n,r.node(n)))
  r.edges().forEach(e => rgraph.addLink(e.v,e.w,r.edge(e)))
  var name,discount
  var PathFinder = ngraph.path.nba(rgraph,{
    distance(v,w,l){
      discount = v.data.paths[name] && w.data.paths[name] ? 0.9 : 1
      return l.data.weight*discount
    }
  })
  g.edges().forEach(e => {
    name = g.edge(e).name = e.v+'.'+g.edge(e).type
    g.edge(e).path = PathFinder.find(g.node(e.w).enter,g.node(e.v).exit).map(n => n.id)
    g.edge(e).path.forEach((n,i) => {
      if(!r.node(n).paths[name]){
        // Remember all of the paths (each having multiple edges) that pass through this route node, 
        // assigning them the same coordinates as the route node as defaults, (will be changed in the next step)
        r.node(n).paths[name] = {
          x:r.node(n).x,
          y:r.node(n).y,
          edges:[{e:e,prev:g.edge(e).path[i-1],next:g.edge(e).path[i+1]}],
        }
      } else {
        // keep in mind that this route doesn't get all the edges 
        // that use the path, only the ones that go through it
        r.node(n).paths[name].edges.push({e:e,prev:g.edge(e).path[i-1],next:g.edge(e).path[i+1]})
      }
    })
  })
  // Clean out everything that didn't get used
  r.nodes().filter(n => r.node(n).type != 'course' && Object.keys(r.node(n).paths).length==0).forEach(n => r.removeNode(n))
}

function assignLanes(g,r){
  function mash(segments,n,m){
    !segments[n].nodes.includes(m) && segments[n].nodes.push(m)
    segments[m] = segments[n]
  }
  function calculateLanes(paths){
    var numLayer = 0
    var slots = paths.reduce((slots,path) => {
      var j = 0
      // while there are collisions, move to the next layer
      while(slots[j].some(existing => existing.min < path.max && existing.max > path.min)){
        ++j
        slots[j] = slots[j] || []
      }
      slots[j].push(path)
      path.layer = j
      numLayer = Math.max(numLayer,path.layer+1)
      return slots
    },[[]])
    // slots.forEach(slot => slot.forEach(path => path.numLayer = slot.length))
    return numLayer
  }

  var grid = r.nodes().reduce((grid,n) => {
    var col = grid.cols[r.node(n).x] = grid.cols[r.node(n).x] || {type:r.node(n).type,nodes:[],paths:{},numLayer:0}
    var row = grid.rows[r.node(n).y] = grid.rows[r.node(n).y] || {segments:{}}
    col.nodes.push(n)
    // For each path that goes through this route node
    Object.keys(r.node(n).paths).forEach(name => {
      // vertical paths
      var vertpath = col.paths[name] = col.paths[name] || {min:r.node(n).y,max:r.node(n).y,nodes:[]}
      vertpath.min = Math.min(vertpath.min,r.node(n).y)
      vertpath.max = Math.max(vertpath.max,r.node(n).y)
      vertpath.span = vertpath.max-vertpath.min
      vertpath.nodes.push(n)

      // horizontal paths
      // Create all the segments
      var segments = row.segments
      segments[n] = segments[n] || {paths:{},nodes:[n]}
      segments[n].paths[name] = segments[n].paths[name] || {}
      r.node(n).paths[name].edges.forEach(edge => {
        [edge.prev,edge.next].filter(n => n).forEach(near => {
          if(segments[near] && segments[n] != segments[near]){
            segments[near].nodes.forEach(m => mash(segments,n,m))
          } else {
            mash(segments,n,near)
          }
        })
      })
    })
    return grid
  },{cols:{},rows:{}})
  window.grid = grid
  // Assign each vertical path a lane
  Object.values(grid.cols).forEach(col => {
    var paths = Object.values(col.paths).sort((a,b) => b.span-a.span)
    col.numLayer = calculateLanes(paths)
  })

  // Assign each horizontal path a lane
  Object.entries(grid.rows).forEach(([y,row]) => {
    Object.values(row.segments).filter((n,i,a) => i==a.indexOf(n)).forEach(segment => {
      Object.entries(segment.paths).forEach(([name,path]) => {
        path.nodes = segment.nodes.filter(n => r.node(n).paths[name])
        path.max = Math.max(...path.nodes.map(n => r.node(n).x))
        path.min = Math.min(...path.nodes.map(n => r.node(n).x))
        path.pull = path.nodes.reduce((sum,n) => {
          var col = grid.cols[r.node(n).x]
          var side = +(r.node(n).x==path.min)*-1 + (r.node(n).x==path.max)*1
          // Im sorry, this line is going to take a couple paragraphs to explain
          return ((col.numLayer-1)*(side==-1) + col.paths[name].layer*side)*dir(r.node(n).y-y)
        },0)
        if(path.max == path.min){
          delete segment.paths[name]
        }
      })
      var paths = Object.values(segment.paths).sort((a,b) => a.pull-b.pull)
      segment.numLayer = calculateLanes(paths)
      Object.entries(segment.paths).forEach(([name,path]) => {
        path.nodes.filter(n => r.node(n).y == y).forEach(n => {
          r.node(n).paths[name].y += g.graph().lanesep * (path.layer-(segment.numLayer-1)/2)
        })
      })
    })
  })
  return grid.cols
}

function adjustColSpacing(g,r,cols){
  var x = g.graph().marginx || 0
  Object.entries(cols).sort((a,b) => a[0]-b[0]).map(n => n[1]).forEach((col,ci,arr) => {
    if(col.type=='course'){
      if(ci && arr[ci-1].type!='course'){
        x += g.graph().ranksep/2 // buffer between the end of the logics and start of courses
      }
      x += g.graph().nwidth // space for course width
      col.nodes.forEach((n,i) => {
        r.node(n).x = x // the course column routes
        if(r.node(n).name){
          // course node and each of it's parents (if any)
          for(let m = r.node(n).name; m; m = g.parent(m)){
            g.node(m).x = x
          }
        }
        Object.keys(r.node(n).paths).forEach(name => {
          r.node(n).paths[name].x = x
        })
      })
      x += g.graph().ranksep/2
    } else {
      x += g.graph().layersep * col.numLayer
      col.nodes.forEach(n => {
        r.node(n).x = x // the logic column routes
        if(r.node(n).name){
          g.node(r.node(n).name).x = x // the logic nodes
        }
        // Each of the lanes on the logic column
        Object.keys(r.node(n).paths).forEach(name => {
          r.node(n).paths[name].x = x - (g.graph().lanesep * (col.paths[name].layer+1)*(r.node(n).type != 'exit'))
        })
      })
      x += g.graph().layersep
    }
  })
  g.graph().width = x
}

function finishLogicConnections(g,r,cols){
  g.nodes().filter(n => g.node(n).op == 'AND').forEach(n => {
    g.inEdges(n).map(e => {
      var route = g.node(n).enter
      var path = r.node(route).paths[g.edge(e).name]
      // their lane distance multiplied by the direction they are coming from
      var weight = path.x * dir(r.node(path.edges[0].prev).y - r.node(route).y)
      // in case there are multiple coming directly on, keep the same place they aready have
      weight += (path.y-r.node(route).y)/2
      // don't care about all the edges cause they should all have the same prev
      return {e,route,path,weight}
    }).sort((a,b) => a.weight-b.weight).forEach(({e,path,route},i,a) => {
      path.y = r.node(route).y + g.graph().lanesep * (i-(a.length-1)/2)
      path.edges.forEach(edge => {
        if(r.node(edge.prev).y == r.node(route).y){
          r.node(edge.prev).paths[g.edge(e).name].y = path.y
        }
      })
    })
  })
}

function layout(g){
  setEdgeThickness(g)
  createGroups(g)
  rundagre(g)
  orderGroupChildren(g)
  fixLeafNodes(g)
  positionLogicsInLevels(g)
  compileGrid(g)
  adjustLogics(g)
  const r = addRouting(g)
  findPaths(g,r)
  const cols = assignLanes(g,r)
  adjustColSpacing(g,r,cols)
  finishLogicConnections(g,r)
  return r
}
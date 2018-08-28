g.nodes()
.forEach(n => {
  if(g.node(n).type == 'course'){
    g.predecessors(n).filter(pre => g.node(pre).type == 'course').forEach(pre => clone.setEdge(pre,n,{}))
    g.successors(n).filter(suc => g.node(suc).type == 'course').forEach(suc => clone.setEdge(n,suc,{}))
    clone.setNode(n,g.node(n))
  } else {
    g.predecessors(n).forEach(pre => g.successors(n).forEach(suc => clone.setEdge(pre,suc,{})))
  }
})

col.sort((a,b) => a.y-b.y).concat({y:g.graph().height}).reduce((last,n,ni) => {
  console.log(memory)
  memory.forEach((mem,mi) => {
    var i = ci-memory.length+mi
    var node = addNode(grid[i].x,n.y)
    r.setEdge(mem,node)
    if(mi && n.n){
      r.setEdge(memory[mi-1],node)
    }
    memory[mi] = node
  })
  if(n.n){
    r.setEdge(memory[memory.length-1],n.n,{},n.n)
  }
  // if(n.y-last > g.graph().nheight){
  // }
  return n.y
},0)

.attr('d',d => {
  var s = g.node(d.v)
  var t = g.node(d.w)
  // return describeLine(s.x,s.y,t.x,t.y)
  return [
    'M',s.x,s.y,
    'L',t.x-t.width,t.y,
  ].join(' ')
})

function routesrender(r){
  const $routes = svg.append('g')
  $routes.append('g').selectAll('line')
    .data(r.edges())
    .enter().append('line')
      // .attr('stroke-width',e => r.nodeEdges(e.v,e.w).length)
      .attr('stroke-opacity',e => e.name && r.edge(e.v,e.w,e.name) ? 0.5 : 0)
      .attr('stroke',e => e.name && r.edge(e.v,e.w,e.name) ? 'black' : 'red')
      .attr('x1',e => r.node(e.v).x)
      .attr('y1',e => r.node(e.v).y)
      .attr('x2',e => r.node(e.w).x)
      .attr('y2',e => r.node(e.w).y)
  // $routes.append('g').selectAll('circle')
  //   .data(r.nodes())
  //   .enter().append('circle')
  //     .attr('data-id',n => n)
  //     .attr('fill',n => ({route:'black',course:'red',logic:'red',mid:'purple'})[r.node(n).type])
  //     .attr('fill-opacity',n => r.node(n).type=='route' ? 1 : 1)
  //     .attr('r',n => r.node(n).type=='route' ? 2 : 2)
  //     .attr('cx',n => r.node(n).x)
  //     .attr('cy',n => r.node(n).y)
}

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
      // addEdge(created,node.n)
      // addEdge(memory[mi-1],created)
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
// // Back node connections
if(grid[ci].x == node.x){
  addEdge(memory[memory.length-1],node.n)
}


  // Find the starts and ends of each horizontal path
Object.entries(grid.rows).forEach(([y,row]) => { 
  Object.entries(row.paths).forEach(([name,path]) => {
    var connections = {}
    path.nodes.forEach(n => {
      connections[n] = connections[n] || [n]
      r.node(n).paths[name].edges.forEach(edge => {
        [edge.prev,edge.next].forEach(near => {
          if(connections[near] && connections[n] != connections[near]){
            connections[near].forEach(m => {
              !connections[n].includes(m) && connections[n].push(m)
              connections[m] = connections[n]
            })
          } else {
            !connections[n].includes(near) && connections[n].push(near)
            connections[near] = connections[n]
          }
        })
      })
    })
    Object.values(connections).filter((n,i,a) => i==a.indexOf(n)).forEach(section => {
      section.reduce()
    })
  })
})


Object.values(grid.rows).forEach(row => {
  Object.entries(row.paths).filter(([name,path]) => path.start != path.end).forEach(([name,path]) => {
    var before
    var after = []
    
    r.node(path.start).paths[name].edges
      .map(e => g.edge(e).path)
      .filter(route => route.includes(path.start) && route.includes(path.end))
      .forEach(route => {
        var last = route[route.indexOf(path.start)-1]
        var next = route[route.indexOf(path.end)+1]
        next && !after.includes(next) && after.push(next)
        if(before && last != before){
          throw new Error ('Coming from multiple places')
        } else {
          before = last
        }
      })
    name == 'FDSCI101.pre' && console.log(path,before,after)
  })
})

connections[n] = connections[n] || [n]
r.node(n).paths[name].edges.forEach(edge => {
  [edge.prev,edge.next].filter(n => n).forEach(near => {
    if(connections[near] && connections[n] != connections[near]){
      connections[near].forEach(m => {
        !connections[n].includes(m) && connections[n].push(m)
        connections[m] = connections[n]
      })
    } else {
      !connections[n].includes(near) && connections[n].push(near)
      connections[near] = connections[n]
    }
  })
})

Object.entries(grid.rows).forEach(([y,row]) => {
  Object.entries(row.paths).forEach(([name,path]) => {
    row.paths[name] = Object.values(path).filter((n,i,a) => i==a.indexOf(n)).map(section => ({
      nodes:section,
      pull:section.reduce((sum,n) => {
        // console.log(name,r.node(n).x,grid.cols[r.node(n).x].paths)
        var col = grid.cols[r.node(n).x]
        var weight = (col.numLayer - col.paths[name].layer)*dir(r.node(n).y-y)
        // console.log((col.numLayer - col.paths[name].layer),dir(r.node(n).y-y),weight)
        return sum+weight
      },0)
    }))
    console.log(row.paths[name])
  })
  Object.entries(row.paths).forEach(([name,path]) => {
    // console.log(path)
  })
})

var horzpath = row.paths[name] = row.paths[name] || {friends:new Set()}
r.node(n).paths[name].edges.forEach(edge => {
  edge.prev && r.node(edge.prev).y != r.node(n).y && horzpath.friends.add(edge.prev)
  edge.next && r.node(edge.next).y != r.node(n).y && horzpath.friends.add(edge.next)
})

Object.entries(grid.rows).forEach(([y,row]) => {
  Object.entries(row.paths).forEach(([name,path]) => {
    path.friends = Array.from(path.friends)
    path.pull = path.friends.reduce((sum,n) => {
      var col = grid.cols[r.node(n).x]
      return sum+(col.numLayer - col.paths[name].layer)*dir(r.node(n).y-y)
    },0)
  })
  Object.values(row.paths).sort((a,b) => a.pull-b.pull).forEach((path,level) => {

  })
  // Object.entries(row.paths).forEach(([name,path]) => {
  //   console.log(path)
  // })
})

Object.entries(row.nodes).map(([name,path]) => {
  return Object.values(path).filter((n,i,a) => i==a.indexOf(n)).map(segment => ({
    nodes:segment,
    pull:segment.reduce((sum,n) => {
      var col = grid.cols[r.node(n).x]
      return sum+(col.numLayer - col.paths[name].layer)*dir(r.node(n).y-y)
    },0),
    min:Math.min(...segment.map(n => r.node(n).x)),
    max:Math.max(...segment.map(n => r.node(n).x)),
    name:name,
  }))
},[]).forEach(segment => {
  console.log(segment)
  segment.sort((a,b) => a.pull-b.pull)
  var numLayer = calculateLanes(segment)
  segment.forEach(path => {
    path.nodes.filter(n => r.node(n).y==y).forEach(n => {
      r.node(n).paths[path.name].y += g.graph().lanesep * path.layer//-(path.numLayer-1)/2)
    })
  })
})

if(segments[m]){
  Object.entries(segments[m].paths).forEach(([name,path]) => {
    if(segments[n].paths[name]){
      path.nodes.forEach(n => segments[n].paths[name].nodes.add(n))
      // segments[n].paths[name].nodes.push(...path.nodes)
    } else {
      segments[n].paths[name] = path
      segments[n].paths[name].nodes.add(n)
    }
  })
}

var path = g.edge(e).path
var last = path[path.length-1]
Object.values(r.node(last).paths).forEach(path => path.edges.forEach(edge => edge.next = exit))
r.node(exit).paths[g.edge(e).name] = {
  x:r.node(exit).paths[name].x,
  y:r.node(exit).paths[name].y,
  edges:[{prev:last,next:exit}]
}
path.push(exit)


/* 
line.req.disabled.pre { stroke:#DDD; }
line.req.enabled.pre { stroke: #888; }
line.req.active.pre { stroke:black; }
line.req.disabled.co { stroke:#B1F0F0; }
line.req.enabled.co { stroke:#40CFC3 }
line.req.active.co { stroke:#007876 }
line.req.disabled.concur { stroke:#F2BEF2; }
line.req.enabled.concur { stroke:#B551B5; }
line.req.active.concur { stroke:#4D004D; }
*/
/* 
line.req.disabled.pre { stroke:#AAA; }
line.req.active.pre { stroke:black; }
line.req.disabled.co { stroke:#7AE0D6; }
line.req.active.co { stroke:#00857B }
line.req.disabled.concur { stroke:#E5A5E0; }
line.req.active.concur { stroke:#5E0057; }
*/

  // Assign the x coordinate to all the logics
  // But we have no gaurentee that all the logics will 
  // fit within the space between course columns, so we
  // need to adjust all of the course columns as we go along
  var newColumns = {}
  for(var courseCol=0,offset=0; courseCol <= g.graph().grid.length; courseCol++){
    // Manipulate the grid to spread by the offset
    if(courseCol){
      var col = g.graph().grid[courseCol-1]
      newColumns[col.x+offset] = g.graph().columns[col.x]
      col.x += offset
      col.nodes.forEach(n => {
        g.node(n).x += offset
      })
    }
    // handle slots without anything in them (can't do filter cause that would mess up the iterator)
    if(!slots[courseCol]) continue;
    slots[courseCol].forEach((level,logicCol) => {
      level.forEach(n => {
        // if courseCol is 0, then use 0. otherwise find that columns x
        g.node(n).x = (courseCol && g.graph().grid[courseCol-1].x) + g.graph().layersep*logicCol
      })
      offset += g.graph().layersep
    })
    offset += g.graph().layersep
  }
  g.graph().columns = newColumns
  g.graph().width += offset


  /* Compile Grid */
  g.nodes().filter(n => g.node(n).type=='logic')
  .reduce((cols,n) => {
    cols[g.node(n).x] = cols[g.node(n).x] || {x:g.node(n).x,type:'logic',nodes:[]}
    cols[g.node(n).x].nodes.push(n)
    return cols
  },g.graph().columns)
g.graph().grid = Object.entries(g.graph().columns)
  .sort((a,b) => a[0] - b[0])
  .map((a,i) => a[1])
  // Insert an extra logic column in front of every course column
  .reduce((arr,col,i,grid) => {
    col.ci = arr.length
    arr.push(col)
    if(grid[i+1] && grid[i+1].type == 'course'){
      var extraCol = {
        x:col.x+g.graph().layersep,
        type:'logic',
        nodes:[],
        ci:arr.length,
      }
      g.graph().columns[extraCol.x] = extraCol
      arr.push(extraCol)
    }
    return arr
  },[])
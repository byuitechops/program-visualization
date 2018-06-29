const courses = require('./courses')
const { Graph,alg } = require('@dagrejs/graphlib')

function stringify(tree){
  if(tree.course) return tree.course
  return '['+tree.sub.map(n => n.course || stringify(n)).sort().join(' ')+']'+(tree.type=='ALL'?'*':'+')
}

function addEdge(graph,parent,tree,type){
  if(tree.sub){
    if(tree.sub.length == 1){
      tree = tree.sub[0]
    } else if(tree.sub.length == 0){
      console.warn(parent,'had a length 0 sub')
      return
    }
  }
  if(tree.course != undefined){
    graph.setEdge(parent,tree.course.replace(/\s+/g,''),{type:type})
    addCourse(graph,tree.course)
  } else if(tree.sub){
    var key = stringify(tree)
    graph.setNode(key,{type:'logic'})
    graph.setEdge(parent,key,{type:type,logic:tree.type=='ALL'?'AND':'OR'})
    tree.sub.forEach(sub => addEdge(graph,key,sub,type))
  } else {
    console.error(parent,'Req did not have a .course or .sub')
    throw new Error('Req did not have a .course or .sub')
  }
}

function addCourse(graph,course){
  course = course.replace(/\s+/g,'')
  if(graph.node(course) != undefined){
    // console.warn(course+' already in graph')
    return
  }
  graph.setNode(course,{type:'course'})
  if(!courses[course]){
    console.warn(course,'was not found')
    return
  }
  var reqs = courses[course].reqs
  Object.entries(reqs).forEach(([type,tree]) => {
    addEdge(graph,course,tree,type)
  })
}

const reqs = new Graph()
Object.keys(courses).forEach(c => addCourse(reqs,c))
// console.log(reqs.nodes())
// console.log(reqs.edges())
// console.log(alg.components(reqs))
// console.log(reqs.inEdges('[[ACCTG 201 ACCTG 202 ACCTG 301 ECON 150 ECON 151]* [ACCTG 201 ACCTG 202 ECON 150 ECON 151 ECON 215 FDMAT 112]* [ACCTG 201 ACCTG 202 ECON 150 ECON 151 ECON 215 MATH 119]* [ACCTG 201 ECON 150 ECON 151 ECON 215]* [B 301 B 321 B 341 B 361]* [B 302 B 322 B 342]*]+'))
console.log(reqs.nodes().filter(n => n.length > 100).map(n => reqs.inEdges(n)))
console.log('nodes:',reqs.nodeCount(),'edges:',reqs.edgeCount())
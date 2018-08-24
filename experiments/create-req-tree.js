const graphlib = require('@dagrejs/graphlib')
const courses = require('../courses')
const logic = require('./logic')
const fs = require('fs')

function logicify(tree){
  if(tree.course) { return tree.course.replace(/\s+/g,'') }
  return logic.SET(tree.sub.map(logicify),tree.type == 'ALL' ? 'AND' : 'OR')
}

function addEdge(graph,parent,logexp,type){
  if(typeof logexp == 'string'){
    graph.setEdge(logexp,parent,{type:type})
    addCourse(graph,logexp)
  } else if(Array.isArray(logexp)){
    var key = logexp.toString()
    graph.setNode(key,{type:'logic',logexp:logexp,op:logexp.op})
    graph.setEdge(key,parent,{type:type})
    logexp.forEach(sub => addEdge(graph,key,sub,type))
  } else {
    console.error(parent,'Req did not have a .course or .sub')
    throw new Error('Req did not have a .course or .sub')
  }
}

function addCourse(graph,course){
  course = course.replace(/\s+/g,'')
  // Courses has already been entered into graph
  if(graph.node(course) != undefined){ return }
  graph.setNode(course,{type:'course'})
  if(!courses[course]){
    console.warn(course,'was not found')
    return
  }
  var reqs = courses[course].reqs
  Object.entries(reqs).forEach(([type,tree]) => {
    addEdge(graph,course,logic.simplify(logicify(tree)),type)
  })
}

// function complete(graph,node,type='pre',visited=[]){
//   var children = graph.outEdges(node).filter(e => graph.edge(e).type == type).map(e => e.w)
//   visited.push(node)
//   var completes = children.filter(n => !visited.includes(n)).map(child => complete(graph,child,type,visited))
//   if(graph.node(node).type == 'logic'){
//     return logic.SET(completes,graph.node(node).logexp.op)
//   } else {
//     return logic.SET([node,...completes],'AND')
//   }
// }

// function prune(graph,node,type='pre'){
//   var children = graph.outEdges(node).filter(e => graph.edge(e).type == type).map(e => e.w)
//   if(graph.node(node).type=='course'){
//     if(children.length){
//       return prune(graph,children[0],type) 
//     } else {
//       return
//     }
//   }
//   var completes = children.map(child => logic.simplify(complete(graph,child,type)))
//   if(!graph.node(node).logexp){
//     console.log(node,graph.node(node))
//   }
//   var op = graph.node(node).logexp.op
//   var full = logic.simplify(logic.SET(completes.slice(),op)).toString()
//   var changed = false, taken = []
//   do{
//     var partials = completes.map((_,i,a) => {
//       var partial = a.slice()
//       partial.splice(i,1)
//       return logic.simplify(logic.SET(partial,op)).toString()
//     })
//     if(partials.indexOf(full) != -1){
//       var dupi = partials.indexOf(full)
//       taken.push(completes.splice(dupi,1))
//     }
//   } while(changed)
//   console.log(taken)
// }


const reqs = new graphlib.Graph({compound:true});
// addCourse(reqs,'B458')
["FDREL475","FDREL471","FDENG301","FDENG101","B320","FDENG101","GEOL316","GEOL351","FDENG101","HUM316","HUM305","FDMAT112","MATH109","MATH111","MATH119","MATH109","ECON215","ECON150","AGBUS210","MATH109","FDSCI200","FDSCI101","FDMAT108","FDSCI101","ECON215","FDSCI101","FDMAT112","FDSCI201","FDSCI101","FDSCI202","FDENG101","FDSCI101","FDSCI206","FDENG101","FDSCI101","FDSCI209","FDSCI101","FDMAT108","FDMAT112","ECON215","FDSCI299P","FDSCI101","FDSCI203","FDSCI101","FDSCI204","FDENG101","FDSCI101","FDSCI205","FDSCI101","FDMAT108","FDMAT112","ECON215","FDSCI210","FDSCI101","FDSCI299L","FDSCI101","FDSCI212","FDSCI101","FDSCI213","FDSCI101","FDSCI299S","FDSCI101","FDLIT216","FDENG101","FDLIT299","FDENG101","ACCTG202","ACCTG201","AGBUS201","ACCTG301","ACCTG201","ACCTG202","ACCTG302","ACCTG301","ACCTG321","ACCTG201","ACCTG202","ACCTG333A","ACCTG201","ACCTG202","ACCTG333B","ACCTG201","ACCTG202","ACCTG344","ACCTG301","ACCTG398R","ACCTG301","ACCTG321","ACCTG456","ACCTG398R","ACCTG499","ACCTG302","ACCTG398R","B401","ACCTG202","B215","B302","B215","B301","ACCTG301","ECON255","ACCTG312","ACCTG201","ACCTG202","ACCTG322","ACCTG321","ACCTG403","ACCTG302","ACCTG440","ACCTG301","ACCTG302","B361","MATH221A","MATH221B","MATH221C","MATH330","B499E","B398R","ECON300","AGBUS210","ECON150","ECON215","ECON150","AGBUS210","MATH109","ECON255","ECON151","AGBUS210","ECON150","AGBUS201","ACCTG201","ECON278","ECON215","FDMAT112","ECON330","ECON151","FDENG101","AGBUS210","ECON150","ECON278","MATH221A","ECON353","ECON151","AGBUS210","ECON150","ECON355","ECON255","ECON358","ECON151","ECON150","AGBUS210","ECON365","ECON150","AGBUS210","ECON381","ECON151","AGBUS210","ECON150","ECON215","FDMAT112","ECON440","ECON151","AGBUS210","ECON150","ECON444","ECON151","AGBUS210","ECON150","ECON455","ECON355","CIT230","CIT160","CIT260","CIT160","CIT225","CIT160","CS124"].forEach(c => addCourse(reqs,c))

// console.log(reqs.nodes())
// console.log(reqs.edges())
// console.log(graphlib.alg.components(reqs).filter(n => n.length > 1))
// console.log(reqs.inEdges('[[ACCTG 201 ACCTG 202 ACCTG 301 ECON 150 ECON 151]* [ACCTG 201 ACCTG 202 ECON 150 ECON 151 ECON 215 FDMAT 112]* [ACCTG 201 ACCTG 202 ECON 150 ECON 151 ECON 215 MATH 119]* [ACCTG 201 ECON 150 ECON 151 ECON 215]* [B 301 B 321 B 341 B 361]* [B 302 B 322 B 342]*]+'))
// console.log(reqs.nodes().filter(n => n.length > 100).map(n => reqs.inEdges(n)))

console.log('nodes:',reqs.nodeCount(),'edges:',reqs.edgeCount())

fs.writeFileSync('req-tree.js','var reqTree = '+JSON.stringify(graphlib.json.write(reqs)));
// BAD: B458 B478 MUSIC158A

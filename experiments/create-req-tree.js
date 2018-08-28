const graphlib = require('@dagrejs/graphlib')
const courses = require('../courses')
const logic = require('./logic')
const fs = require('fs')

const programs = [
  /* Core */["ACCTG201","ACCTG202","ACCTG301","ACCTG302","ACCTG321","ACCTG333A","ACCTG333B","ACCTG344","ACCTG398R","ACCTG456","ACCTG499","B275","B401","ECON150","ECON151","MATH221A"],
  /* Elective */["ACCTG312","ACCTG322","ACCTG403","ACCTG440"],
  /* Business */["B321","B341","B361","B499A","B499E"],
  /* Economics */["ECON300","ECON215","ECON255","ECON278","ECON330","ECON353","ECON355","ECON358","ECON365","ECON381","ECON440","ECON444","ECON455"],
  /* Programming */["CIT111","CIT160","CIT230","CIT260"],
  /* Project Lifecycle */["CIT111","CIT160","CIT225","CIT380"],
  /* Cornerstone Courses */["FDREL200","FDREL225","FDREL250","FDREL275"],
  /* Other Religon */["FDREL100","FDREL121","FDREL122","FDREL130","FDREL190","FDREL211","FDREL212","FDREL215","FDREL234","FDREL235","FDREL261","FDREL301","FDREL302","FDREL324","FDREL325","FDREL327","FDREL333","FDREL341","FDREL342","FDREL345","FDREL351","FDREL352","FDREL390R","FDREL397","FDREL404","FDREL431","FDREL471","FDREL475"],
  /* Fundementals */["FDENG101","FDENG301","B320","GEOL316","HUM316","FDMAT108","FDMAT112","MATH119","ECON215"],
  /* Science */["FDSCI101","FDSCI200","FDSCI201","FDSCI202","FDSCI206","FDSCI210","FDSCI299L","FDSCI203","FDSCI204","FDSCI205","FDSCI206","FDSCI210","FDSCI299L","FDSCI206","FDSCI212","FDSCI213","FDSCI299S"],
  /* Culture */["FDAMF101","FDCIV101","FDHUM110","FDWLD101","FDHUM214","FDHUM299","FDINT211","FDINT212","FDINT213","FDINT215","FDINT299","FDLIT216","FDLIT299","FDWLD201"],
].reduce((obj,program,i) => (program.forEach(n => obj[n] = i),obj),{})

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
  graph.setNode(course,{type:'course',program:programs[course]})
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
// addCourse(reqs,'B478')
["FDREL475","FDREL471","FDENG301","FDENG101","B320","FDENG101","GEOL316","GEOL351","FDENG101","HUM316","HUM305","FDMAT112","MATH109","MATH111","MATH119","MATH109","ECON215","ECON150","AGBUS210","MATH109","FDSCI200","FDSCI101","FDMAT108","FDSCI101","ECON215","FDSCI101","FDMAT112","FDSCI201","FDSCI101","FDSCI202","FDENG101","FDSCI101","FDSCI206","FDENG101","FDSCI101","FDSCI209","FDSCI101","FDMAT108","FDMAT112","ECON215","FDSCI299P","FDSCI101","FDSCI203","FDSCI101","FDSCI204","FDENG101","FDSCI101","FDSCI205","FDSCI101","FDMAT108","FDMAT112","ECON215","FDSCI210","FDSCI101","FDSCI299L","FDSCI101","FDSCI212","FDSCI101","FDSCI213","FDSCI101","FDSCI299S","FDSCI101","FDLIT216","FDENG101","FDLIT299","FDENG101","ACCTG202","ACCTG201","AGBUS201","ACCTG301","ACCTG201","ACCTG202","ACCTG302","ACCTG301","ACCTG321","ACCTG201","ACCTG202","ACCTG333A","ACCTG201","ACCTG202","ACCTG333B","ACCTG201","ACCTG202","ACCTG344","ACCTG301","ACCTG398R","ACCTG301","ACCTG321","ACCTG456","ACCTG398R","ACCTG499","ACCTG302","ACCTG398R","B401","ACCTG202","B215","B302","B215","B301","ACCTG301","ECON255","ACCTG312","ACCTG201","ACCTG202","ACCTG322","ACCTG321","ACCTG403","ACCTG302","ACCTG440","ACCTG301","ACCTG302","B361","MATH221A","MATH221B","MATH221C","MATH330","B499E","B398R","ECON300","AGBUS210","ECON150","ECON215","ECON150","AGBUS210","MATH109","ECON255","ECON151","AGBUS210","ECON150","AGBUS201","ACCTG201","ECON278","ECON215","FDMAT112","ECON330","ECON151","FDENG101","AGBUS210","ECON150","ECON278","MATH221A","ECON353","ECON151","AGBUS210","ECON150","ECON355","ECON255","ECON358","ECON151","ECON150","AGBUS210","ECON365","ECON150","AGBUS210","ECON381","ECON151","AGBUS210","ECON150","ECON215","FDMAT112","ECON440","ECON151","AGBUS210","ECON150","ECON444","ECON151","AGBUS210","ECON150","ECON455","ECON355","CIT230","CIT160","CIT260","CIT160","CIT225","CIT160","CS124"].forEach(c => addCourse(reqs,c))

// console.log(reqs.nodes())
// console.log(reqs.edges())
// console.log(graphlib.alg.components(reqs).filter(n => n.length > 1))
// console.log(reqs.inEdges('[[ACCTG 201 ACCTG 202 ACCTG 301 ECON 150 ECON 151]* [ACCTG 201 ACCTG 202 ECON 150 ECON 151 ECON 215 FDMAT 112]* [ACCTG 201 ACCTG 202 ECON 150 ECON 151 ECON 215 MATH 119]* [ACCTG 201 ECON 150 ECON 151 ECON 215]* [B 301 B 321 B 341 B 361]* [B 302 B 322 B 342]*]+'))
// console.log(reqs.nodes().filter(n => n.length > 100).map(n => reqs.inEdges(n)))

console.log('nodes:',reqs.nodeCount(),'edges:',reqs.edgeCount())

fs.writeFileSync('../backtothestart/req-tree.js','var reqTree = '+JSON.stringify(graphlib.json.write(reqs)));
// BAD: B458 B478 MUSIC158A

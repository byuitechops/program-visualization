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

var foundations = [
    /* Cornerstone Courses */["FDREL200","FDREL225","FDREL250","FDREL275"],
    /* Other Religon */["FDREL100","FDREL121","FDREL122","FDREL130","FDREL190","FDREL211","FDREL212","FDREL215","FDREL234","FDREL235","FDREL261","FDREL301","FDREL302","FDREL324","FDREL325","FDREL327","FDREL333","FDREL341","FDREL342","FDREL345","FDREL351","FDREL352","FDREL390R","FDREL397","FDREL404","FDREL431","FDREL471","FDREL475"],
    /* Fundementals */["FDENG101","FDENG301","B320","GEOL316","HUM316","FDMAT108","FDMAT112","MATH119","ECON215"],
    /* Science */["FDSCI101","FDSCI200","FDSCI201","FDSCI202","FDSCI206","FDSCI210","FDSCI299L","FDSCI203","FDSCI204","FDSCI205","FDSCI206","FDSCI210","FDSCI299L","FDSCI206","FDSCI212","FDSCI213","FDSCI299S"],
    /* Culture */["FDAMF101","FDCIV101","FDHUM110","FDWLD101","FDHUM214","FDHUM299","FDINT211","FDINT212","FDINT213","FDINT215","FDINT299","FDLIT216","FDLIT299","FDWLD201"],
]

;[{
  name:'accounting',
  subprograms:[
    /* Core */["ACCTG201","ACCTG202","ACCTG301","ACCTG302","ACCTG321","ACCTG333A","ACCTG333B","ACCTG344","ACCTG398R","ACCTG456","ACCTG499","B275","B401","ECON150","ECON151","MATH221A"],
    /* Elective */["ACCTG312","ACCTG322","ACCTG403","ACCTG440"],
    /* Business */["B321","B341","B361","B499A","B499E"],
    /* Economics */["ECON300","ECON215","ECON255","ECON278","ECON330","ECON353","ECON355","ECON358","ECON365","ECON381","ECON440","ECON444","ECON455"],
    /* Programming */["CIT111","CIT160","CIT230","CIT260"],
    /* Project Lifecycle */["CIT111","CIT160","CIT225","CIT380"],
  ]
},{
  name:'computerscience',
  subprograms:[
    /* Core */["CS124","CS165","CS235","ECEN160","CS213","CS237","CS238","CS246","CS306","CS308","CS345","CS364","CS416","CS432","CS470","ECEN324","MATH330","MATH341","PH150"],
    /* Elective */["CS225","CS312","CS313","CS371","CS450","CS460","CS480","CS490R","ECEN260","ECEN361"],
    /* Internship */["CS398","CS498R"],
    /* Senior Project */["CS499","CS499A","CS499B"]
  ]
},{
  name:'arted',
  subprograms:[
    /* Education Core */["ED200","ED304","ED461","ED492","SPED360"],
    /* Art Core */["ART101","ART107","ART110","ART201","ART202","ART220","ART314","ART390","ART414","ART395R","ART297R"],
    /* Lower Division */["ART142","ART210","ART212R","ART217","ART250","ART251","ART270","ART280","ART310","ART312R"],
    /* Upper Division */["ART310","ART312R","ART320","ART350","ART351R","ART357R","ART370","ART380","ART410R","ART412R","ART491R"],
  ]
}].forEach(program => {
  var reqs = new graphlib.Graph({compound:true});

  ;[].concat(...program.subprograms).forEach(c => addCourse(reqs,c))
  
  program.subprograms.push(...foundations)

  var subprograms = program.subprograms.reduce((obj,program,i) => (program.forEach(n => obj[n] = i),obj),{})
  reqs.nodes().forEach(n => reqs.node(n).program = subprograms[n])

  fs.writeFileSync(`../backtothestart/${program.name}.js`,'var reqTree = '+JSON.stringify(graphlib.json.write(reqs)));
})


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



// addCourse(reqs,'B458')
// BAD: B458 B478 MUSIC158A

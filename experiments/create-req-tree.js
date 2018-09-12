const graphlib = require('@dagrejs/graphlib')
const courses = require('../courses')
const logic = require('./logic')
const fs = require('fs')
const path = require('path')



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
},{
  name:'english',
  subprograms:[
    /* Introductory Module */["ENG251","ENG314"],
    /* Core Courses */["ENG331","ENG332","ENG333","ENG336","ENG334","ENG335","ENG336","ENG350R","ENG351","ENG352","ENG353","ENG354","ENG355","ENG356","ENG325","ENG328","ENG373"],
    /* Senior Project */["ENG452","ENG495"],
    /* 400 Level */["ENG418R","ENG400R","ENG440","ENG450","ENG452","ENG495"],
    /* Electives */["ENG218","ENG252","ENG290R","ENG318R","ENG321","ENG326","ENG327","ENG331","ENG332","ENG333","ENG334","ENG335","ENG336","ENG350R","ENG351","ENG352","ENG353","ENG354","ENG355","ENG356","ENG370R","ENG390","ENG397R","ENG398R","ENG400R","ENG418R","ENG440","ENG450","ENG452","ENG495"],
  ]
},{
  name:'datascience',
  subprograms:[
    /* Core */["CIT111","CS101","CS241","MATH325","MATH425","MATH488"],
    /* Data Wrangling */["CS335","MATH335"],
    /* Intership */["CIT498","CS498R","MATH498R"],
    /* Senior Project */["CIT499R","CS499","MATH499R"],
    /* Statistics */["MATH221A","MATH221B","MATH221C"],
    /* Analytics */["CIT381","CS450"],
    /* Elective */["B215","CIT225","CIT381","CIT425","CS213","CS237","CS246","CS313","CS450","FDMAT112","MATH113","MATH119","MATH214","MATH215","MATH241","MATH281","MATH326","MATH341","MATH423","MATH424","B211","B320","CIT380","COMM130","DCM221","DCM350"],
  ]
},{
  name:'business',
  subprograms:[
    /* Core */["ACCTG201","ACCTG202","B100","B211","B215","B298R"/* ,"B361" */,"B398R","ECON150","ECON151","MATH221A","B499A","B499E","B380","B483","ECON358"],
    /* IBC */["B302","B322","B342","B301","B321","B341"],
    /* Entrepreneurial Mangagement */["B183","B283","B383","B250","B351","B374","B475"],
    /* Finance */["B401","B410","B428","B433","B411","B424","B413","B424","B424D","B475"],
    /* Marketing */["B430","B446","B351","COMM322","COMM332","COMM385","B466","B468","B250","B451"],
    /* Social Media Marketing */["COMM125","B351","B250","B451","COMM310","COMM315","COMM322","COMM397R"],
    // /* Supply Chain Management */["B461","B466","B468","B478"],
  ]
},{
  name:'construction',
  subprograms:[
    /* Core */["ARCH100","CONST120","ARCH190","ARCH270","CONST235","CONST260","CONST298","CONST320","CONST330","CONST350","CONST370","CONST380","CONST420","CONST430","CONST470","CONST498","CONST499"],
    /* Architecture */["ARCH120","ARCH180","ARCH201","ARCH220","ARCH180","ARCH285","ARCH290","ARCH300","CONST290R","CONST400","DCM221","DCM225","DCM305","DCM350","ID251","ACCTG180","ACCTG201","B101","B211","B215","B225","B283","B301","B321","B341","B361","B413","ECON150","MATH221A"],
    /* Business */["ARCH120","ARCH180","ARCH220","ARCH290","ARCH300","CONST210","CONST250","CONST290R","CONST300","CONST340","CONST400","DCM221","DCM225","DCM305","DCM350","ID251","ACCTG180","ACCTG201","B211","B215","B361","ECON150","MATH221A","MATH221B","MATH221C","B302","B322","B342","B301","B321","B341"],
    /* Environmental Health And Safety */["ARCH300","CONST210","CONST250","CONST290R","CONST300","DCM221","DCM225","DCM305","DCM350","HS310","HS486","HS384","HS450","HS484","HS485","HS487","HS488","ACCTG180","ACCTG201","B101","B211","B215","B225","B283","B301","B321","B341","B361","B413","ECON150","MATH221A"],
    /* Heavy Civil/Industrial */["CONST250","CONST340","ARCH120","ARCH220","ARCH290","ARCH300","CONST210","CONST290R","CONST400","DCM221","DCM225","DCM305","DCM350","ACCTG180","ACCTG201","B101","B211","B215","B225","B283","B301","B321","B341","B361","B413","ECON150","MATH221A"],
    /* Residential/Commercial */["ARCH120","CONST210","ARCH180","ARCH201","ARCH220","ARCH290","ARCH300","CONST250","CONST290R","CONST300","CONST340","CONST400","DCM221","DCM225","DCM305","DCM350","ID251","ACCTG180","ACCTG201","B101","B211","B215","B225","B283","B301","B321","B341","B361","B370","B413","ECON150","MATH221A"],
  ]
}].forEach(program => {
  var reqs = new graphlib.Graph({compound:true});

  ;[].concat(...program.subprograms).forEach(c => addCourse(reqs,c))
  
  program.subprograms.push(...foundations)

  var subprograms = program.subprograms.reduce((obj,program,i) => (program.forEach(n => obj[n] = i),obj),{})
  reqs.nodes().forEach(n => reqs.node(n).program = subprograms[n])

  fs.writeFileSync(path.resolve(__dirname,`../backtothestart/programs/${program.name}.js`),'var reqTree = '+JSON.stringify(graphlib.json.write(reqs)));
  fs.writeFileSync(path.resolve(__dirname,`../backtothestart/programs/${program.name}.html`),`
<html>
  <head>
    <link href="../style.css" type="text/css" rel="stylesheet"/>
    <!-- Data -->
    <script src="${program.name}.js"></script>
    <!-- Libraries -->
    <script src="../libraries/d3.min.js" charset="utf-8"></script>
    <script src="../libraries/dagre.min.js"></script>
    <script src="../libraries/ngraph.min.js"></script>
    <!-- Helpers -->
    <script src="../util.js"></script>
    <script src="../layout.js"></script>
  </head>
  <body>
    <script src="../main.js"></script>
  </body>
</html>
  `)
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

const dir = n => n/Math.abs(n)||0
let DEBUG = false
// Just for debugging, please take out for production
Object.defineProperty(Array.prototype,'$',{
  get:function(){ return this.map(n => $(`[data-id="${n}"]`)) }
})
Function.prototype.time = function time(){
  DEBUG && console.time(this.name)
  var returned = this.apply(this,arguments)
  DEBUG && console.timeEnd(this.name)
  return returned
}
String.prototype.on = function(){
  return (g.node(this).op=='OR'?'some':'every')+' '+g.predecessors(this).map(n => n+`[${+!!g.node(n).enabled}${+!!g.node(n).active}]${Boolean(g.node(n).type=='course'?g.node(n).active:g.node(n).enabled)}`).join(' , ')
}

/* Helper function to recursively find all the courses to succed this node */
function findCourses(g,n,fn,collection=[],first=true){
  if(!first && g.node(n).type == 'course'){
    collection.push(n)
  } else {
    g[fn](n).map(n => findCourses(g,n,fn,collection,false))
  }
  return collection
}

/* Helper function to calculate the mean y coordinate weighted by x distance */
function weightedMean(g,n,nodes){
  var sum=0,totalweight=0
  nodes.forEach(m => {
    // 1/(num of columns the parent is away)
    var weight = (g.graph().nwidth+g.graph().ranksep)/Math.abs(g.node(n).x-g.node(m).x)
    sum += g.node(m).y * weight
    totalweight += weight
  })
  return sum/totalweight
}
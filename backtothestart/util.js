const findCourses = (g,n,fn,first=true) => !first && g.node(n).type == 'course' ? n : [].concat(...fn(n).map(n => findCourses(g,n,fn,false)))
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
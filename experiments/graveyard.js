g.setDefaultNodeLabel(() => ({ rank:null, type:(Math.floor(Math.random()*2) ? 'course' : 'logic')}))

g.setNode(1,{type:'logic'});                                                           
g.setNode(2,{type:'logic'});                                                           
g.setNode(3,{type:'course'});
g.setNode(4,{type:'logic'});
g.setNode(5,{type:'logic'});
g.setNode(7,{type:'course'});
g.setNode(8,{type:'course'});
// g.setNode(1);                                                           
// g.setNode(2);                                                           
// g.setNode(3);
// g.setNode(4);
// g.setNode(5);
// g.setNode(7);
// g.setNode(8);
g.setEdge(1,2);                                                        
g.setEdge(2,3);                                                        
g.setEdge(3,1);                                                                                                                                
g.setEdge(4,5);
g.setEdge(2,5);
g.setEdge(5,3);
g.setEdge(7,8);


function closestOpen(arr,index){
  for(var dist = 0; dist < arr.length; dist++){
    for(var dir = -1; dir < 2; dir+=2){
      var i = index+dist*dir
      if(i >= 0 && i < arr.length && arr[i] == undefined){
        return i
      }
    }
  }
}

function order(){
  var rows = Array.from(levels.loop()).map(i => levels.get(i))
  rows.forEach(row => row.forEach((n,i) => g.node(n).order = i))
  for(var i = 1; i < rows.length; i++){
    var row = rows[i].map(w => ({
      key:w,
      predecessors:g.predecessors(w).map(n => g.node(n).order)
    }))
    console.log(row)
    var order = new Array(Math.max(row.length,rows[i-1].length))
    for(var k = 0; k < row.length; k++){
      var n = row[k]
      if(n.predecessors.length == 1 && order[n.predecessors[0]] == undefined){
        order[n.predecessors[0]] = n.key
        row.splice(k--,1)
      }
    }
    console.log(row,order)
  }
}

console.log('before',from,order)
to.filter(n => n.vs.length == 1).forEach(n => {
  console.log('single',n)
  var target = from.indexOf(n.vs[0])
  if(order[target] == undefined){
    console.log(n.w,target)
    order[target] = n.w
  } else {
    from.splice(target,0,undefined)
    order.splice(target,0,n.w)
  }
})
console.log('after singles',from,order)
to.filter(n => n.vs.length > 1).forEach(n => {
  var target = median(n.vs.map(v => from.indexOf(v)))
  console.log(n,target)
  if(order[target] == undefined){
    order[target] = n.w
  } else {
    from.splice(target,0,undefined)
    order.splice(target,0,n.w)
  }
})
console.log('after',from,order)

'ABC'.split('').forEach(n => {
  levels.get([0]).push(n);
  g.node(n).rank = levels.rank()
})
'DEFG'.split('').forEach(n => {
  levels.get([1]).push(n);
  var r = levels.rank()
  r.increment(0)
  g.node(n).rank = r
})
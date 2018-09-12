const equal = require('deep-equal')
const util = require('util')

const OR = (...arr) => {
  if(arr.length==1 && Array.isArray(arr[0])){ arr = arr[0] }
  arr.op = 'OR'
  return arr
}
const AND = (...arr) => {
  if(arr.length==1 && Array.isArray(arr[0])){ arr = arr[0] }
  arr.op = 'AND'
  return arr
}
const SET = (arr,op) => {
  if(!['AND','OR'].includes(op)){ throw new Error('Invalid operator '+op) }
  arr.op = op;
  return arr
}
const DEBUG = require.main == module
if(!DEBUG){
  var console = {log:() => {}}
}

var old = Array.prototype.toString
Array.prototype.toString = function(){
  if(this.op){
    return `[${this.map(n => n.toString()).sort().join(' ')}]${this.op=='AND'?'*':'+'}`
  } else {
    return old.call(this,...arguments)
  }
}

function pointify(nodes=new Map(),node,i,a){
  // recurse postfix order
  node.op && node.sort().forEach(pointify.bind(null,nodes))
  var key = Array.isArray(node).toString()+node.length, sector = nodes.get(key), same
  if(sector){
    same = sector.find(n => equal(n,node))
    if(same){
      a[i] = same
    } else {
      sector.push(node)
    }
  } else {
    nodes.set(key,[node])
  }
}

function normalize(root,index=0,a=[root]){
  // postfix order recursion
  if(!root.op) return root
  root.forEach(normalize)
  
  var changed
  do{
    if(!root.op) break;
    changed = false

    // [[A B]* C]* -> [A B C]*
    let matching = []
    for(let i = 0; i < root.length; i++){
      if(root[i].op == root.op){
        console.log('Same/',root.toString())
        matching.push(...root.splice(i--,1)[0])
        changed = true
      }
    }
    root.push(...matching)
    changed && console.log('/Same',root.toString())
  
    // [A A] -> [A]
    for(let i = 0; i < root.length-1; i++){
      if(root.slice(i+1).find(n => equal(n,root[i]))){
        console.log('Duplicate/',root.toString())
        root.splice(i--,1)
        console.log('/Duplicate',root.toString())
        changed = true
      }
    }
  
    // [A] -> A
    if(root.length == 1){
      console.log('Single/',root.toString(),root[0].toString(),'/Single')
      a[index] = root[0]
      root = a[index]
      changed = true
    }
  } while(changed)
  return a[index] || []
}

function simplify(root,index=0,a=[root]){
  if(!root.op) return root
  root.forEach(simplify)
  var changed
  do{
    if(!root.op) break;
    changed = false
    root = normalize(root)
    pointify(undefined,root)
    a[index] = root
    
    let grandchildren = new Map()
    
    // [[]] -> []
    for(let i = 0; i < root.length; i++){
      if(root[i].op && root[i].length == 0){
        root.splice(i--,1)
        changed = true
      }
    }
    if(changed) continue;

    for(let i = 0; i < root.length; i++){
      if(root[i].op){
        root[i].forEach((grandchild,j) => {
          if(grandchildren.has(grandchild)){
            grandchildren.get(grandchild).push(i)
          } else {
            grandchildren.set(grandchild,[i])
          }
        })
      }
    }

    
    // [[A B]+ A]* -> [A]*
    for(let i = 0; i < root.length; i++){
      if(grandchildren.has(root[i])){
        console.log('Annialation/',root.toString())
        grandchildren.get(root[i]).sort().reverse().map(i => root.splice(i,1))
        console.log('/Annialation',root.toString())
        changed = true
      }
    }
    // grandchildren need to be reset if changes have occured
    if(changed) continue;

    // [[A B]+ [A C]+]* -> [[[B C]* A]+]*
    for(let [key,value] of grandchildren.entries()){
      if(value.length > 1){
        console.log('Distribute/',root.toString())
        let bunched = SET(value.map(i => {
          root[i].splice(root[i].indexOf(key),1)
          return root[i]
        }),root.op)
        value.sort().reverse().map(i => root.splice(i,1))
        let created = simplify(SET([key,bunched],root.op=='AND'?'OR':'AND'))
        root.push(created)
        console.log('/Distribute',root.toString())
        changed = true
        break;
      }
    }
  } while(changed)
  return root
}

if(DEBUG){
  // var node = AND('ACCTG202',OR(AND('B215','B302'),AND('B215','B301'),OR('ACCTG301','ECON255')))
  // var node = AND(AND('ECON151','FDENG101'),OR('AGBUS201','ECON150'),OR('ECON271','MATH221A'))
  // var node = OR(AND('A','B','C'),AND('B','C','D'),AND('D','E'))
  // var node = OR(AND('A','B'),AND('B','C'),AND('C','D'),AND('D','A'))
  console.log('start',node.toString())
  console.log('final',simplify(node).toString())
}

module.exports = { AND,OR,SET,simplify }
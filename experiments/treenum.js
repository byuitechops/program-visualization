// var rank = {
//   _nums:[0,0,0],
//   get major(){ return _nums[0] },
//   get minor(){ return _nums[1] },
//   get patch(){ return _nums[2] },
//   set major(val){
//     this._nums = [val,0,0]
//   },
//   set minor(val){
//     this._nums.splice(1,this._nums.length,)
//   }
// }

var util = require('util')

var handler = {
  get(target,prop){
    if(typeof prop == 'string' && !isNaN(prop) && target[prop] == undefined){
      return 0
    }
    return target[prop]
  },
  set(target,prop,val){
    if(typeof prop == 'string' && !isNaN(prop) && target[prop] != val){
      if(isNaN(val)){
        throw new TypeError('value must be a number')
      }
      target[prop] = val
      target.splice(prop,target.length,val)
    }
    return true
  }
}

function create(nums=[]){
  nums[util.inspect.custom] = function(){ return '['+this.join('.')+']' }
  nums.add = function(other){ return reduceRight(this,other,(a,b) => a+b,this) }
  nums.subtract = function(other){ return reduceRight(this,other,(a,b) => a-b,this) }
  nums.diff = function(other){ return reduceRight(this,other,(a,b) => Math.abs(a-b),this) }
  return new Proxy(nums,handler)
}

function reduce(a,b,iteri,acm=create()){
  var length = Math.max(a.length,b.length)
  for(var i = 0; i < length; i++){
    acm[i] = iteri(a[i],b[i],i)
  }
  return acm
}
function reduceRight(a,b,iteri,acm=create()){
  for(var i = Math.max(a.length,b.length); i >= 0; i--){
    acm[i] = iteri(a[i],b[i],i)
  }
  return acm
}

module.exports = create
module.exports.diff = (a,b) => reduce(a,b,(a,b) => Math.abs(a-b))
module.exports.add = (a,b) => reduce(a,b,(a,b) => a+b)
module.exports.subtract = (a,b) => reduce(a,b,(a,b) => a-b)

var num = create([1,0,3])
console.log(create([1,0,1]).diff(create([0,1,1])))
// console.log(module.exports.add(create([1,0,1]),create([0,1,1])))
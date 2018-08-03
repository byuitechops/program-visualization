var util = require('util')
const levels = []

function get(ranks){
  return ranks.reduce((node,rank,i) => node[rank] = node[rank] || [],levels)[0]
}
function set(ranks,val){
  return ranks.reduce((node,rank,i) => node[rank] = node[rank] || [],levels)[0] = val
}

function Rank(nums){
  this._nums = [0,0]
  if(nums){
    this[0] = nums[0]
    this[1] = nums[1]
  }
}

Object.defineProperties(Rank.prototype,{
  0:{
    get:function(){ return this._nums[0] },
    set:function(val){
      get()
      this._nums = [val,0]
    },
  },
  1:{
    get:function(){ return this._nums[1] },
    set:function(val){
      this._nums[1] = val
      if(levels[this._nums[0]] == undefined){
        levels[this._nums[0]] = []
      }
      if(levels[this._nums[0]].length <= this._nums[1]){
        levels[this._nums[0]].length = this._nums[1]+1
      }
    },
  },
})

Rank.prototype.clone = function(){return new Rank(this._nums)}
Rank.prototype.greaterThan = function(other){return this[0]==other[0]?this[1]>other[1]:this[0]>other[0]}
Rank.prototype.equals = function(other){return this[0]==other[0] && this[1]==other[1]}
Rank.prototype.lessThan = function(other){return this[0]==other[0]?this[1]<other[1]:this[0]<other[0]}
Rank.prototype.valueOf = function(){ return '['+this._nums.join('.')+']' }
Rank.prototype.toString = Rank.prototype.valueOf
Rank.prototype[util.inspect.custom] = Rank.prototype.valueOf
module.exports = Rank

var r = new Rank([0,0])
r[0]++
r[1]++

console.log(levels)
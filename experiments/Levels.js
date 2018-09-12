function firstIndexNotSame(A,B,compare){
  if(A.length !== B.length){
    throw new Error('Arrays are not the same length')
  }
  for(var i = 0; i < A.length; i++){
    if(A[i] !== B[i]){
      return i
    }
  }
  return -1
}

class Rank extends Array {
  constructor(deepness){
    super(deepness)
    this.fill(0)
    this.deepness = deepness
  }
  setParent(parent){ this.parent = parent }
  clone(){
    var n = new Rank(this.deepness)
    n.setParent(this.parent)
    return Object.assign(n,this)
  }
  equals(other){ return firstIndexNotSame(this,other) == -1 }
  greaterThan(other){
    var i = firstIndexNotSame(this,other)
    return i == -1 ? false : this[i] > other[i]
  }
  lessThan(other){
    var i = firstIndexNotSame(this,other)
    return i == -1 ? false : this[i] < other[i]
  }
  valueOf(){ return '['+this.join('.')+']' }
  toString(){ return this.valueOf() }
  increment(level){
    if(level >= this.deepness){
      throw new Error('Ain\'t have enough layers for that')
    }
    this[level]++
    // Fill everything after the changed number to 0s
    // Just like versioning ex. [0.1.1] => [1.0.0]
    this.fill(0,level+1,this.deepness)
    this.parent.get(this)
    return this
  }
}

class Levels extends Array {
  constructor(deepness){
    super()
    this.deepness = deepness
    this.get(Array(this.deepness).fill(0))
  }
  get(ranks){
    return ranks.reduce((node,rank) => node[rank] = node[rank] || [],this)
  }
  rank(){
    var rank = new Rank(this.deepness)
    rank.setParent(this)
    return rank
  }
  * loop(inti,to){
    inti = inti ? inti.clone() : this.rank()
    // Gets the length of the array at the given level
    const length = ranks => ranks.reduce((node,rank) => node[rank],this).length
    let done = false, i
    while(to==undefined || !inti.equals(to)){
      i = this.deepness-1
      // Finding which level needs to be incremented
      while(i >= 0 && inti[i] == length(inti.slice(0,i)) - 1){ --i }
      yield inti.clone()
      if(i < 0){
        break;
      } else {
        inti.increment(i)
      }
    }
  }
}

function testing(){
  var l = new Levels(3)
  console.log(l)
  var int = l.rank()
  int.increment(2)
  int.increment(0)
  int.increment(1)
  int.increment(2)
  console.log(l)
  console.log([...l.loop(int)])
}

// var i = 0
// var path = [0,0,0]
// console.log(length([ [ [ [] ] ] , [ [ [] ] ] ],path.slice(0,i))-1,path[i])
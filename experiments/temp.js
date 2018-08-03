var a = [1,2,3,4,5,6,7,8]
var mean = a.reduce((a,b) => a+b,0)/a.length
a.sort((a,b) => Math.abs(a-mean)-Math.abs(b-mean))


function closestOpen(arr,index){
  for(var dist = 1; dist <= arr.length; dist++){
    for(var dir = -1; dir < 2; dir+=2){
      var i = index+dist*dir
      if(i >= -1 && i <= arr.length && arr[i] == undefined){
        return i
      }
    }
  }
  return 0
}

console.log('enter',closestOpen([3],0))
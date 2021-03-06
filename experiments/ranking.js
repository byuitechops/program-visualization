window.ranking = (function(){
  let levels
  let g

  function fixCycles(){
    do {
      var cycles = graphlib.alg.findCycles(g)
      cycles.forEach(cycle => {
        // find an edge in the cycle
        var v = cycle[0], w = g.successors(v).find(n => cycle.includes(n))
        var edge = g.edge(v,w)
        edge.reversed = true
        g.removeEdge(v,w)
        g.setEdge(w,v,edge)
      })
    } while(!graphlib.alg.isAcyclic(g))
  }

  function display(full=false){
    var pad = g.edges().reduce((a,{v,w}) => Math.max(v.length,a),0)
    for(let i of levels.loop()){
      console.log(i+'  '+levels.get(i).map(n => (n!=undefined ? n.toString() : '').padEnd(pad+2)).join(''))
    }
    if(full){
      g.edges().forEach(({v,w}) => {
        console.log(v.padStart(pad),g.edge(v,w).reversed ? '<-' : '->',w)
      })
    }
  }

  function rank(){
    // for each component in our graph get the recursive rank function running
    graphlib.alg.components(g).forEach(component => {
      rankNode(component[0])
    })

    function rankNode(n){
      var node = g.node(n)

      // this function may be called on nodes that already have a rank
      // but we will still need to check that all of our children have a rank
      if(node.rank == null){
        // get the ranks of our parents (recursing if they do not have a rank assigned yet)
        var parentRanks = g.predecessors(n).map(n => {
          var rank = g.node(n).rank
          return rank != null ? rank : rankNode(n)
        })
        // If adding the parents some how added ours, then we are done
        if(node.rank){
          return node.rank
        }
        if(parentRanks.length){
          // Give our node a rank of one more than our parent with the biggest rank
          node.rank = parentRanks.reduce((max,n) => n.greaterThan(max) ? n : max).clone()
          // increment either major or minor based on node type
          node.rank.increment(+(node.type=='logic'))
        } else {
          // it is a source node
          node.rank = levels.rank()
        }
        // Add a reference in levels
        levels.get(node.rank).push(n)
      }
      
      // recurse for our children who do not have a rank yet
      g.successors(n).filter(n => g.node(n).rank == null).forEach(n => rankNode(n))

      return node.rank
    }
  }

  function addInBetweens(){
    g.edges().forEach(({v,w}) => {
      var [from,to] = [g.node(v),g.node(w)]
      if(!from.rank.lessThan(to.rank)){
        console.error(from,to,v,w)
        throw new Error('Connection going the wrong way')
      }
      // levels.loop is a generator function, 
      // Array.from will run that generator
      var betweens = Array.from(levels.loop(from.rank,to.rank))
      if(betweens.length > 1){
        var last = v
        var edge = g.edge(v,w)
        // the first one is just the 'from', we only want the inbetweens
        betweens.slice(1).forEach((r,i) => {
          var key = `${v}>${w}|${i}`
          g.setNode(key,{type:'inbetween',rank:r})
          g.setEdge(last,key,edge)
          // Add a reference in levels
          levels.get(r).push(key)
          last = key
        })
        g.setEdge(last,w,edge)
        g.removeEdge(v,w)
      }
    })
  }

  function median(arr){
    if(arr.length%2){
      return arr[Math.floor(arr.length/2)]
    } else {
      var i = (arr.length/2)-1
      return Math.floor((arr[i]+arr[i+1])/2)
    }
  }

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

  function insert(from,to,order,target,elm,i){
    from.splice(target,0,undefined)
    order.splice(target,0,elm)
    to.splice(target,0,undefined)
    if(target <= i){ 
      return i+1
    } else {
      return i
    }
  }

  function order(){
    var rows = Array.from(levels.loop()).map(i => levels.get(i))
    for(var diri = 0; diri < 21; diri++){
      let dir = !(diri%2)
      // display()
      for(let r = dir?1:rows.length-2; r >= 0 && r < rows.length; r+=(dir?1:-1)){
        var from = rows[r+(dir?-1:1)]
        var to = rows[r].map(w => w!=undefined?{w:w,vs:g[dir?'predecessors':'successors'](w)||[]}:undefined)
        var order = []
        // console.log(`[ ${Array.from(from).map(n => n!=undefined?n:'_').join(' ')} ] -> [ ${Array.from(to).map(n => n!=undefined?n.w:'_').join(' ')} ]`)
        
        // Single Parent, Open Spot
        //    The simplest decision, put it under the parent. These have 
        //    the utmost priority hence why it is in it's own loop to make
        //    sure that they all get put in before stuff starts to get shuffled
        //    around
        for(let i = 0; i < to.length; i++){
          if(to[i]!=undefined && to[i].vs.length == 1){
            let n = to[i], target = from.indexOf(n.vs[0])
            if(order[target] == undefined){
              // console.log(n.w,'direct')
              to[i] = undefined
              order[target] = n.w
            }
          }
        }
        // Single Parent, Search for Spot
        //    Because only single parents have been used, only direct child spots have been clamied,
        //    we can assume that all these nodes are single parent but have siblings.
        for(let i = 0; i < to.length; i++){
          if(to[i]!=undefined && to[i].vs.length == 1){
            let n = to[i], target = from.indexOf(n.vs[0])
            to[i] = undefined
            // If there are neighboring open spots, those are up for grabs because
            // we know that there is no parent-child hovering above those spots
            var neigh = [target+1,target-1].filter(k => order[k] == undefined)
            if(neigh.length >= 1){
              if(neigh[0] == -1){
                // console.log(n.w,'neighbor unshift')
                i = insert(from,to,order,0,n.w,i)
              } else {
                // console.log(n.w,'neighbor')
                order[neigh[0]] = n.w
              }
            } else {
              // No neighboring spots are open, so that means that either our parent
              // has more than 3 children, or it is next to parent-child direct links
              // So our only option is to inject and push it's way in. I don't think
              // it matters which side of the target it is injected on
              // console.log(n.w,'injecting')
              i = insert(from,to,order,target,n.w,i)
            }
          }
        }
        
        // Multi-Parent
        //    Search for open spot within parent's range, with priority as follows
        //      1. Directly under Middle parent
        //      3. In the middle spots
        //      2. Directly under edge parents
        //    If no open spots then inject one. in the middle, not nessesarily next
        //    to the middle parent, cause it can't get straight under it anyway 
        for(let i = 0; i < to.length; i++){
          if(to[i]!=undefined && to[i].vs.length > 1){
            let n = to[i], parents = n.vs.map(p => from.indexOf(p))
            to[i] = undefined
            var mean = parents.reduce((a,b) => a+b,0)/parents.length
            var max = Math.max(...parents)
            var min = Math.min(...parents)
            // Middle Parents
            var middleParents = parents.filter(p => p!=max&&p!=min)
              .sort((a,b) => Math.abs(a-mean)-Math.abs(b-mean))
              .filter(k => order[k] == undefined)
            if(middleParents.length != 0){
              // console.log(n.w,'Middle Parent')
              order[middleParents[0]] = n.w
              continue;
            }
            // Middle Spots
            var range = Array(max-min+1).fill().map((n,i) => min+i)
            var middleSpots = range.filter(s => !parents.includes(s))
              .sort((a,b) => Math.abs(a-mean)-Math.abs(b-mean))
              .filter(k => order[k] == undefined)
            if(middleSpots.length != 0){
              // console.log(n.w,'Middle Spot')
              order[middleSpots[0]] = n.w
              continue;
            }
            // Max Min
            var maxmin = [max,min]
              // .sort((a,b) => Math.abs(a-i)-Math.abs(b-i)) // Prevents the walking M
              .filter(k => order[k] == undefined)
            if(maxmin.length != 0){
              // console.log(n.w,'Max Min')
              order[maxmin[0]] = n.w
              continue;
            }
            // Inject
            // console.log(n.w,'Inject Middle')
            var target = min + Math.ceil(range.length/2)
            i = insert(from,to,order,target,n.w,i)
          }
        }

        // Clean Up, All unclaimed
        //    Get them the closest open spot to their current placement
        //    including off the ends of the array, if nessesary
        for(let i = 0; i < to.length; i++){
          if(to[i]!=undefined){
            let n = to[i], target = closestOpen(order,i)
            to[i] = undefined
            if(target == -1){
              // console.log(n.w,'closest unshift')
              i = insert(from,to,order,0,n.w,i)
            } else {
              // console.log(n.w,'closest')
              order[target] = n.w
            }
          }
        }
        Object.assign(rows[r],Array.from(order))
        rows[r].length = order.length
      }
    }
  }

  function generate(str,connections){
    var inti = levels.rank()
    str.trim().split('\n').forEach((row,r,rows) => {
      row.trim().replace(/\s+/g,'').split('').forEach((n) => {
        levels.get([r]).push(n)
        if(g.node(n) == undefined){
          g.setNode(n)
        }
        g.node(n).rank = inti.clone()
      })
      if(r != rows.length-1){
        inti.increment(0)
      }
    })
    connections.trim().split('\n').forEach((row,r,rows) => {
      var [v,w] = row.trim().split(/\W+/)
      g.setEdge(v,w)
    })
  }

  function clean(){
    var empties = []
    var ls = Array.from(levels.loop()).map(inti => levels.get(inti))
    ls.forEach(level => {
      level.forEach((n,i) => {
        if(n == undefined && empties[i] != false){
          empties[i] = i
        } else {
          empties[i] = false
        }
      })
    })
    empties.reverse().forEach((n,i) => {
      if(n != false){
        ls.forEach(level => {
          if(level[n] != undefined){
            throw new Error('Something went wrong')
          }
          level.splice(n,1)
        })
      }
    })
  }

  function main(graph){
    levels = new Levels(2)
    g = graph
    fixCycles()
    rank()
    addInBetweens()
    order()
    clean()
    return levels
  }

  return main
})()
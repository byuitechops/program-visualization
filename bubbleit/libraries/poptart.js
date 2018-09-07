(function(window){

  const HEAD = Symbol('HEAD')
  const TAIL = Symbol('TAIL')
  
  function insert(before,node,after,n,p){
    node[p] = before
    if(before) before[n] = node
    node[n] = after
    if(after) after[p] = node
    // if(n2 != null){
    //   n2[n] = n1[n]
    //   if(n2[n] != null){ n2[n][p] = n2 }
    //   n2[p] = n1
    // }
    // n1[n] = n2
  }
  function remove(node){
    node.n.p = node.p
    node.p.n = node.next||node.n
    if(node.next != null) node.next.prev = node.prev
    if(node.prev != null) node.prev.next = node.next
    /* If not on top level */
    if(node.parent){
      --node.parent.length
      /* If node is the first child */
      if(node.parent.head == node) {
        node.parent.head = node.next
        node.parent.n = node.next||node.n
        if(node.parent.head == null) node.parent.tail == null;
      }
      /* If node is the last child */
      if(node.parent.tail == node) {
        node.parent.tail = node.prev
        if(node.parent.next) node.parent.next.p = node.p
        if(node.parent.tail == null) node.parent.head == null;
      }
    }
  }
  const methods = {
    insertBefore(id,data){
      var node = this.create(id,data,this.parent)
      insert(this.prev,node,this,'next','prev')
      insert(this.p,node,this,'n','p')
      if(this.parent){
        ++this.parent.length
        if(this.parent.head == this) this.parent.head = node
      }
      return node.protected
    },
    insertAfter(id,data){
      var node = this.create(id,data,this.parent)
      insert(this,node,this.next,'next','prev')
      insert(this,node,this.n,'n','p')
      if(this.parent){
        ++this.parent.length
        if(this.parent.tail == this) this.parent.tail = node
      }
      return node.protected
    },
    push(id,data){
      var node = this.create(id,data,this)
      ++this.length
      insert(this.tail||this,node,this.next||this.n,'n','p')
      insert(this.tail,node,null,'next','prev');
      this.tail = node
      if(this.head == null) this.head = node;
      console.log(this.id,id,['n','p','next','prev'])
      return node.protected
    },
    unshift(id,data){
      var node = this.create(id,data,this)
      ++this.length
      insert(this,node,this.head||this,'n','p')
      insert(null,node,this.head,'next','prev');
      this.head = node
      if(this.tail == null) this.tail = node;
      return node.protected
    },
    remove(){
      remove(this)
    },
    pop(){
      if(this.tail != null) remove(this.tail)
      return this
    },
    shift(){
      if(this.head != null) remove(this.head)
      return this
    },
    children(){
      var children = []
      for(var node = this.head; node; node = node.next){
        children.push(node.id)
      }
      return children
    }
  }
  
  function Node(id,data,parent=null){
  
    // Remove the last one with this id 
    // (just assuming that they want to move this node)
    if(this.dictionary[id]){
      throw new Error('Node with that id already defined')
      this.dictionary[id].remove()
    }
  
    var node = {
      id:id,
      length:0,
      n:null,
      p:null,
      next:null,
      prev:null,
      head:null,
      tail:null,
      parent:parent,
      create:Node.bind(this)
    }
    
    node.protected = {
      get id(){return node.id},
      get length(){return node.length},
      get n(){return node.n && (node.n.id!=TAIL||null) && node.n.protected },
      get p(){return node.p && (node.p.id!=HEAD||null) && node.p.protected },
      get next(){return node.next && (node.next.id!=TAIL||null) && node.next.protected},
      get prev(){return node.prev && (node.prev.id!=HEAD||null) && node.prev.protected},
      get head(){return node.head && node.head.protected },
      get tail(){return node.tail && node.tail.protected },
      get parent(){return node.parent && (node.prev.id!=HEAD||node.prev.id!=TAIL||null) && node.parent.protected },
    }
  
    Object.keys(methods).forEach(fn => {
      node.protected[fn] = methods[fn].bind(node)
    })

    if(data !== undefined){
      if(typeof data != 'object') throw new Error('Data argument was not an object')
      Object.keys(data).forEach(key => {
        if(node.protected[key]) throw new Error('Cannot set data '+key+' on node, already used')
        node.protected[key] = data[key]
      })
    }
  
    this.dictionary[id] = node.protected
  
    return node
  }
  
  function Tree(){
    var dictionary = this.dictionary = {}
    var head = Node.call(this,HEAD)
    var tail = Node.call(this,TAIL)
  
    head.next = head.n = tail
    tail.prev = tail.p = head
    delete head.protected.insertBefore
    delete head.protected.remove
    delete tail.protected.insertAfter
    delete tail.protected.remove
    delete tail.protected.push
    delete tail.protected.unshift
    
    var tree = function(id){
      return dictionary[id]
    }
    tree.head = head.protected
    tree.tail = tail.protected
    tree._head = head
    tree._tail = tail
    return tree
  }
  
  window.poptart = Tree
})(window)

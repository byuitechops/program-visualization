const findCourses = (g,n,fn,first=true) => !first && g.node(n).type == 'course' ? n : [].concat(...fn(n).map(n => findCourses(g,n,fn,false)))
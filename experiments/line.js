function arc(fromX,fromY,turnX,turnY,toX,toY,r=10){
  const dir = d => d&&d/Math.abs(d)
  var [beforeXdir,beforeYdir] =  [dir(turnX-fromX),dir(turnY-fromY)]
  var [afterXdir,afterYdir] =  [dir(toX-turnX),dir(toY-turnY)]
  return [
    'L',turnX-beforeXdir*r,turnY-beforeYdir*r,
    'A',r,r,0,0,+(!!(beforeXdir+beforeYdir+afterXdir+afterYdir) == !!beforeXdir),turnX+afterXdir*r,turnY+afterYdir*r
  ]
}
function describeLine(fromX,fromY,toX,toY,r=10){
  r = Math.min(Math.abs(fromX-toX)/2,Math.abs(fromY-toY)/2,r)
  var mid = (fromX+toX)/2
  return [
    'M',fromX,fromY,
    ...arc(fromX,fromY,mid,fromY,mid,toY,r),
    ...arc(mid,fromY,mid,toY,toX,toY,r),
    'L',toX,toY
  ].join(' ')
}
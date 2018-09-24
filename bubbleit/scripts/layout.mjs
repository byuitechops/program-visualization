import grouping from './grouping.mjs'
import ranking from './ranking.mjs'
import order from './order.mjs'

export default function* (g){
  grouping.time(g)
  ranking.time(g)
  yield * order.time(g)
}
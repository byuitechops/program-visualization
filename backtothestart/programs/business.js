var reqTree = {"options":{"directed":true,"multigraph":false,"compound":true},"nodes":[{"v":"ACCTG201","value":{"type":"course","program":0}},{"v":"ACCTG202","value":{"type":"course","program":0}},{"v":"[ACCTG201 AGBUS201]+","value":{"type":"logic","logexp":["ACCTG201","AGBUS201"],"op":"OR"}},{"v":"AGBUS201","value":{"type":"course"}},{"v":"B100","value":{"type":"course","program":0}},{"v":"B211","value":{"type":"course","program":0}},{"v":"[FDMAT108 MATH109 MATH221A MATH221B MATH221C]+","value":{"type":"logic","logexp":["FDMAT108","MATH109","MATH221A","MATH221B","MATH221C"],"op":"OR"}},{"v":"FDMAT108","value":{"type":"course","program":8}},{"v":"[]*","value":{"type":"logic","logexp":[],"op":"AND"}},{"v":"MATH109","value":{"type":"course"}},{"v":"MATH101","value":{"type":"course"}},{"v":"MATH221A","value":{"type":"course","program":0}},{"v":"MATH221B","value":{"type":"course"}},{"v":"MATH221C","value":{"type":"course"}},{"v":"B215","value":{"type":"course","program":0}},{"v":"B298R","value":{"type":"course","program":0}},{"v":"B398R","value":{"type":"course","program":0}},{"v":"ECON150","value":{"type":"course","program":0}},{"v":"ECON151","value":{"type":"course","program":0}},{"v":"B499A","value":{"type":"course","program":0}},{"v":"B499E","value":{"type":"course","program":0}},{"v":"B380","value":{"type":"course","program":0}},{"v":"B483","value":{"type":"course","program":0}},{"v":"ECON358","value":{"type":"course","program":0}},{"v":"[ECON151 [AGBUS210 ECON150]+]*","value":{"type":"logic","logexp":["ECON151",["AGBUS210","ECON150"]],"op":"AND"}},{"v":"[AGBUS210 ECON150]+","value":{"type":"logic","logexp":["AGBUS210","ECON150"],"op":"OR"}},{"v":"AGBUS210","value":{"type":"course"}},{"v":"B302","value":{"type":"course","program":1}},{"v":"[ACCTG180 ACCTG201]+","value":{"type":"logic","logexp":["ACCTG180","ACCTG201"],"op":"OR"}},{"v":"ACCTG180","value":{"type":"course"}},{"v":"[B322 B342]*","value":{"type":"logic","logexp":["B322","B342"],"op":"AND"}},{"v":"B322","value":{"type":"course","program":1}},{"v":"[B302 B342]*","value":{"type":"logic","logexp":["B302","B342"],"op":"AND"}},{"v":"B342","value":{"type":"course","program":1}},{"v":"[B302 B322]*","value":{"type":"logic","logexp":["B302","B322"],"op":"AND"}},{"v":"B301","value":{"type":"course","program":1}},{"v":"B321","value":{"type":"course","program":1}},{"v":"B341","value":{"type":"course","program":1}},{"v":"B183","value":{"type":"course","program":2}},{"v":"B283","value":{"type":"course","program":2}},{"v":"B383","value":{"type":"course","program":2}},{"v":"B250","value":{"type":"course","program":5}},{"v":"B351","value":{"type":"course","program":5}},{"v":"B374","value":{"type":"course","program":2}},{"v":"B475","value":{"type":"course","program":3}},{"v":"B401","value":{"type":"course","program":3}},{"v":"[ACCTG202 [ACCTG301 ECON255 [B215 [B301 B302]+]*]+]*","value":{"type":"logic","logexp":["ACCTG202",["ACCTG301","ECON255",["B215",["B301","B302"]]]],"op":"AND"}},{"v":"[ACCTG301 ECON255 [B215 [B301 B302]+]*]+","value":{"type":"logic","logexp":["ACCTG301","ECON255",["B215",["B301","B302"]]],"op":"OR"}},{"v":"ACCTG301","value":{"type":"course"}},{"v":"[ACCTG201 ACCTG202]*","value":{"type":"logic","logexp":["ACCTG201","ACCTG202"],"op":"AND"}},{"v":"ECON255","value":{"type":"course"}},{"v":"[ECON151 [ACCTG201 AGBUS201]+ [AGBUS210 ECON150]+]*","value":{"type":"logic","logexp":["ECON151",["ACCTG201","AGBUS201"],["AGBUS210","ECON150"]],"op":"AND"}},{"v":"[B215 [B301 B302]+]*","value":{"type":"logic","logexp":["B215",["B301","B302"]],"op":"AND"}},{"v":"[B301 B302]+","value":{"type":"logic","logexp":["B301","B302"],"op":"OR"}},{"v":"B410","value":{"type":"course","program":3}},{"v":"[ACCTG301 B215 ECON255]+","value":{"type":"logic","logexp":["ACCTG301","B215","ECON255"],"op":"OR"}},{"v":"B428","value":{"type":"course","program":3}},{"v":"B433","value":{"type":"course","program":3}},{"v":"B411","value":{"type":"course","program":3}},{"v":"[B410 ECON355]+","value":{"type":"logic","logexp":["B410","ECON355"],"op":"OR"}},{"v":"ECON355","value":{"type":"course"}},{"v":"B424","value":{"type":"course","program":3}},{"v":"B413","value":{"type":"course","program":3}},{"v":"B424D","value":{"type":"course","program":3}},{"v":"B430","value":{"type":"course","program":4}},{"v":"[B341 B342]+","value":{"type":"logic","logexp":["B341","B342"],"op":"OR"}},{"v":"B446","value":{"type":"course","program":4}},{"v":"COMM322","value":{"type":"course","program":5}},{"v":"COMM332","value":{"type":"course","program":4}},{"v":"[COMM230 COMM235 COMM240 COMM250 COMM260]+","value":{"type":"logic","logexp":["COMM230","COMM235","COMM240","COMM250","COMM260"],"op":"OR"}},{"v":"COMM230","value":{"type":"course"}},{"v":"COMM111","value":{"type":"course"}},{"v":"[COMM140 [COMM125 COMM130]+]*","value":{"type":"logic","logexp":["COMM140",["COMM125","COMM130"]],"op":"AND"}},{"v":"COMM140","value":{"type":"course"}},{"v":"[COMM125 COMM130]+","value":{"type":"logic","logexp":["COMM125","COMM130"],"op":"OR"}},{"v":"COMM125","value":{"type":"course","program":5}},{"v":"COMM130","value":{"type":"course"}},{"v":"COMM235","value":{"type":"course"}},{"v":"COMM240","value":{"type":"course"}},{"v":"COMM250","value":{"type":"course"}},{"v":"COMM150","value":{"type":"course"}},{"v":"COMM260","value":{"type":"course"}},{"v":"COMM385","value":{"type":"course","program":4}},{"v":"B466","value":{"type":"course","program":4}},{"v":"B361","value":{"type":"course"}},{"v":"[MATH221A MATH221B MATH221C MATH330]+","value":{"type":"logic","logexp":["MATH221A","MATH221B","MATH221C","MATH330"],"op":"OR"}},{"v":"MATH330","value":{"type":"course"}},{"v":"FDMAT112","value":{"type":"course","program":8}},{"v":"[MATH109 MATH111]+","value":{"type":"logic","logexp":["MATH109","MATH111"],"op":"OR"}},{"v":"MATH111","value":{"type":"course"}},{"v":"[MATH101 MATH110X]*","value":{"type":"logic","logexp":["MATH101","MATH110X"],"op":"AND"}},{"v":"MATH110X","value":{"type":"course"}},{"v":"[]+","value":{"type":"logic","logexp":[],"op":"OR"}},{"v":"B468","value":{"type":"course","program":4}},{"v":"B451","value":{"type":"course","program":5}},{"v":"COMM310","value":{"type":"course","program":5}},{"v":"COMM315","value":{"type":"course","program":5}},{"v":"COMM397R","value":{"type":"course","program":5}}],"edges":[{"v":"[ACCTG201 AGBUS201]+","w":"ACCTG202","value":{"type":"pre"}},{"v":"ACCTG201","w":"[ACCTG201 AGBUS201]+","value":{"type":"pre"}},{"v":"AGBUS201","w":"[ACCTG201 AGBUS201]+","value":{"type":"pre"}},{"v":"[FDMAT108 MATH109 MATH221A MATH221B MATH221C]+","w":"B211","value":{"type":"pre"}},{"v":"FDMAT108","w":"[FDMAT108 MATH109 MATH221A MATH221B MATH221C]+","value":{"type":"pre"}},{"v":"[]*","w":"FDMAT108","value":{"type":"pre"}},{"v":"MATH109","w":"[FDMAT108 MATH109 MATH221A MATH221B MATH221C]+","value":{"type":"pre"}},{"v":"MATH101","w":"MATH109","value":{"type":"pre"}},{"v":"MATH221A","w":"[FDMAT108 MATH109 MATH221A MATH221B MATH221C]+","value":{"type":"pre"}},{"v":"MATH221B","w":"[FDMAT108 MATH109 MATH221A MATH221B MATH221C]+","value":{"type":"pre"}},{"v":"MATH221C","w":"[FDMAT108 MATH109 MATH221A MATH221B MATH221C]+","value":{"type":"pre"}},{"v":"B211","w":"B215","value":{"type":"pre"}},{"v":"B398R","w":"B499E","value":{"type":"co"}},{"v":"[ECON151 [AGBUS210 ECON150]+]*","w":"ECON358","value":{"type":"pre"}},{"v":"ECON151","w":"[ECON151 [AGBUS210 ECON150]+]*","value":{"type":"pre"}},{"v":"[AGBUS210 ECON150]+","w":"[ECON151 [AGBUS210 ECON150]+]*","value":{"type":"pre"}},{"v":"AGBUS210","w":"[AGBUS210 ECON150]+","value":{"type":"pre"}},{"v":"ECON150","w":"[AGBUS210 ECON150]+","value":{"type":"pre"}},{"v":"[ACCTG180 ACCTG201]+","w":"B302","value":{"type":"pre"}},{"v":"ACCTG180","w":"[ACCTG180 ACCTG201]+","value":{"type":"pre"}},{"v":"ACCTG201","w":"[ACCTG180 ACCTG201]+","value":{"type":"pre"}},{"v":"[B322 B342]*","w":"B302","value":{"type":"concur"}},{"v":"B322","w":"[B322 B342]*","value":{"type":"concur"}},{"v":"[ACCTG180 ACCTG201]+","w":"B322","value":{"type":"pre"}},{"v":"[B302 B342]*","w":"B322","value":{"type":"concur"}},{"v":"B302","w":"[B302 B342]*","value":{"type":"concur"}},{"v":"B342","w":"[B302 B342]*","value":{"type":"concur"}},{"v":"[ACCTG180 ACCTG201]+","w":"B342","value":{"type":"pre"}},{"v":"[B302 B322]*","w":"B342","value":{"type":"concur"}},{"v":"B302","w":"[B302 B322]*","value":{"type":"concur"}},{"v":"B322","w":"[B302 B322]*","value":{"type":"concur"}},{"v":"B342","w":"[B322 B342]*","value":{"type":"concur"}},{"v":"[ACCTG180 ACCTG201]+","w":"B301","value":{"type":"pre"}},{"v":"[ACCTG202 [ACCTG301 ECON255 [B215 [B301 B302]+]*]+]*","w":"B401","value":{"type":"pre"}},{"v":"ACCTG202","w":"[ACCTG202 [ACCTG301 ECON255 [B215 [B301 B302]+]*]+]*","value":{"type":"pre"}},{"v":"[ACCTG301 ECON255 [B215 [B301 B302]+]*]+","w":"[ACCTG202 [ACCTG301 ECON255 [B215 [B301 B302]+]*]+]*","value":{"type":"pre"}},{"v":"ACCTG301","w":"[ACCTG301 ECON255 [B215 [B301 B302]+]*]+","value":{"type":"pre"}},{"v":"[ACCTG201 ACCTG202]*","w":"ACCTG301","value":{"type":"pre"}},{"v":"ACCTG201","w":"[ACCTG201 ACCTG202]*","value":{"type":"pre"}},{"v":"ACCTG202","w":"[ACCTG201 ACCTG202]*","value":{"type":"pre"}},{"v":"ECON255","w":"[ACCTG301 ECON255 [B215 [B301 B302]+]*]+","value":{"type":"pre"}},{"v":"[ECON151 [ACCTG201 AGBUS201]+ [AGBUS210 ECON150]+]*","w":"ECON255","value":{"type":"pre"}},{"v":"ECON151","w":"[ECON151 [ACCTG201 AGBUS201]+ [AGBUS210 ECON150]+]*","value":{"type":"pre"}},{"v":"[ACCTG201 AGBUS201]+","w":"[ECON151 [ACCTG201 AGBUS201]+ [AGBUS210 ECON150]+]*","value":{"type":"pre"}},{"v":"[AGBUS210 ECON150]+","w":"[ECON151 [ACCTG201 AGBUS201]+ [AGBUS210 ECON150]+]*","value":{"type":"pre"}},{"v":"[B215 [B301 B302]+]*","w":"[ACCTG301 ECON255 [B215 [B301 B302]+]*]+","value":{"type":"pre"}},{"v":"B215","w":"[B215 [B301 B302]+]*","value":{"type":"pre"}},{"v":"[B301 B302]+","w":"[B215 [B301 B302]+]*","value":{"type":"pre"}},{"v":"B301","w":"[B301 B302]+","value":{"type":"pre"}},{"v":"B302","w":"[B301 B302]+","value":{"type":"pre"}},{"v":"[ACCTG301 B215 ECON255]+","w":"B410","value":{"type":"pre"}},{"v":"ACCTG301","w":"[ACCTG301 B215 ECON255]+","value":{"type":"pre"}},{"v":"B215","w":"[ACCTG301 B215 ECON255]+","value":{"type":"pre"}},{"v":"ECON255","w":"[ACCTG301 B215 ECON255]+","value":{"type":"pre"}},{"v":"[ACCTG301 B215 ECON255]+","w":"B411","value":{"type":"pre"}},{"v":"[B410 ECON355]+","w":"B411","value":{"type":"co"}},{"v":"B410","w":"[B410 ECON355]+","value":{"type":"co"}},{"v":"ECON355","w":"[B410 ECON355]+","value":{"type":"co"}},{"v":"ECON255","w":"ECON355","value":{"type":"pre"}},{"v":"[B341 B342]+","w":"B430","value":{"type":"pre"}},{"v":"B341","w":"[B341 B342]+","value":{"type":"pre"}},{"v":"B342","w":"[B341 B342]+","value":{"type":"pre"}},{"v":"[B341 B342]+","w":"B446","value":{"type":"pre"}},{"v":"[COMM230 COMM235 COMM240 COMM250 COMM260]+","w":"COMM332","value":{"type":"pre"}},{"v":"COMM230","w":"[COMM230 COMM235 COMM240 COMM250 COMM260]+","value":{"type":"pre"}},{"v":"COMM111","w":"COMM230","value":{"type":"pre"}},{"v":"[COMM140 [COMM125 COMM130]+]*","w":"COMM230","value":{"type":"co"}},{"v":"COMM140","w":"[COMM140 [COMM125 COMM130]+]*","value":{"type":"co"}},{"v":"[COMM125 COMM130]+","w":"[COMM140 [COMM125 COMM130]+]*","value":{"type":"co"}},{"v":"COMM125","w":"[COMM125 COMM130]+","value":{"type":"pre"}},{"v":"COMM130","w":"[COMM125 COMM130]+","value":{"type":"pre"}},{"v":"COMM235","w":"[COMM230 COMM235 COMM240 COMM250 COMM260]+","value":{"type":"pre"}},{"v":"COMM111","w":"COMM235","value":{"type":"pre"}},{"v":"[COMM140 [COMM125 COMM130]+]*","w":"COMM235","value":{"type":"co"}},{"v":"COMM240","w":"[COMM230 COMM235 COMM240 COMM250 COMM260]+","value":{"type":"pre"}},{"v":"COMM111","w":"COMM240","value":{"type":"pre"}},{"v":"[COMM140 [COMM125 COMM130]+]*","w":"COMM240","value":{"type":"co"}},{"v":"COMM250","w":"[COMM230 COMM235 COMM240 COMM250 COMM260]+","value":{"type":"pre"}},{"v":"COMM150","w":"COMM250","value":{"type":"pre"}},{"v":"COMM260","w":"[COMM230 COMM235 COMM240 COMM250 COMM260]+","value":{"type":"pre"}},{"v":"[COMM230 COMM235 COMM240 COMM250 COMM260]+","w":"COMM385","value":{"type":"pre"}},{"v":"B361","w":"B466","value":{"type":"pre"}},{"v":"[MATH221A MATH221B MATH221C MATH330]+","w":"B361","value":{"type":"pre"}},{"v":"MATH221A","w":"[MATH221A MATH221B MATH221C MATH330]+","value":{"type":"pre"}},{"v":"MATH221B","w":"[MATH221A MATH221B MATH221C MATH330]+","value":{"type":"pre"}},{"v":"MATH221C","w":"[MATH221A MATH221B MATH221C MATH330]+","value":{"type":"pre"}},{"v":"MATH330","w":"[MATH221A MATH221B MATH221C MATH330]+","value":{"type":"pre"}},{"v":"FDMAT112","w":"MATH330","value":{"type":"pre"}},{"v":"[MATH109 MATH111]+","w":"FDMAT112","value":{"type":"pre"}},{"v":"MATH109","w":"[MATH109 MATH111]+","value":{"type":"pre"}},{"v":"MATH111","w":"[MATH109 MATH111]+","value":{"type":"pre"}},{"v":"[MATH101 MATH110X]*","w":"MATH111","value":{"type":"pre"}},{"v":"MATH101","w":"[MATH101 MATH110X]*","value":{"type":"pre"}},{"v":"MATH110X","w":"[MATH101 MATH110X]*","value":{"type":"pre"}},{"v":"[]+","w":"MATH110X","value":{"type":"pre"}},{"v":"B361","w":"B468","value":{"type":"pre"}},{"v":"[COMM125 COMM130]+","w":"COMM310","value":{"type":"pre"}},{"v":"[COMM125 COMM130]+","w":"COMM315","value":{"type":"pre"}}]}
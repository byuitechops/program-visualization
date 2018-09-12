var reqTree = {"options":{"directed":true,"multigraph":false,"compound":true},"nodes":[{"v":"CS124","value":{"type":"course","program":0}},{"v":"CS165","value":{"type":"course","program":0}},{"v":"CS235","value":{"type":"course","program":0}},{"v":"ECEN160","value":{"type":"course","program":0}},{"v":"CS213","value":{"type":"course","program":0}},{"v":"[CS165 CS241]+","value":{"type":"logic","logexp":["CS165","CS241"],"op":"OR"}},{"v":"CS241","value":{"type":"course"}},{"v":"[CS101 CS124]+","value":{"type":"logic","logexp":["CS101","CS124"],"op":"OR"}},{"v":"CS101","value":{"type":"course"}},{"v":"CS237","value":{"type":"course","program":0}},{"v":"CS238","value":{"type":"course","program":0}},{"v":"CS246","value":{"type":"course","program":0}},{"v":"CS306","value":{"type":"course","program":0}},{"v":"[CS235 CS237]*","value":{"type":"logic","logexp":["CS235","CS237"],"op":"AND"}},{"v":"CS308","value":{"type":"course","program":0}},{"v":"[CIT260 CIT336 CS165 CS241]+","value":{"type":"logic","logexp":["CIT260","CIT336","CS165","CS241"],"op":"OR"}},{"v":"CIT260","value":{"type":"course"}},{"v":"CIT160","value":{"type":"course"}},{"v":"CIT336","value":{"type":"course"}},{"v":"CIT230","value":{"type":"course"}},{"v":"CS345","value":{"type":"course","program":0}},{"v":"ECEN324","value":{"type":"course","program":0}},{"v":"[ECEN160 [CS235 CS241]+]*","value":{"type":"logic","logexp":["ECEN160",["CS235","CS241"]],"op":"AND"}},{"v":"[CS235 CS241]+","value":{"type":"logic","logexp":["CS235","CS241"],"op":"OR"}},{"v":"CS364","value":{"type":"course","program":0}},{"v":"CS416","value":{"type":"course","program":0}},{"v":"CS432","value":{"type":"course","program":0}},{"v":"CS470","value":{"type":"course","program":0}},{"v":"MATH330","value":{"type":"course","program":0}},{"v":"FDMAT112","value":{"type":"course","program":6}},{"v":"[MATH109 MATH111]+","value":{"type":"logic","logexp":["MATH109","MATH111"],"op":"OR"}},{"v":"MATH109","value":{"type":"course"}},{"v":"MATH101","value":{"type":"course"}},{"v":"MATH111","value":{"type":"course"}},{"v":"[MATH101 MATH110X]*","value":{"type":"logic","logexp":["MATH101","MATH110X"],"op":"AND"}},{"v":"MATH110X","value":{"type":"course"}},{"v":"[]+","value":{"type":"logic","logexp":[],"op":"OR"}},{"v":"MATH341","value":{"type":"course","program":0}},{"v":"PH150","value":{"type":"course","program":0}},{"v":"PH121","value":{"type":"course"}},{"v":"CS225","value":{"type":"course","program":1}},{"v":"[CIT160 CS124]+","value":{"type":"logic","logexp":["CIT160","CS124"],"op":"OR"}},{"v":"CS312","value":{"type":"course","program":1}},{"v":"CS313","value":{"type":"course","program":1}},{"v":"[CIT336 CS213]+","value":{"type":"logic","logexp":["CIT336","CS213"],"op":"OR"}},{"v":"[CIT260 CS246]+","value":{"type":"logic","logexp":["CIT260","CS246"],"op":"OR"}},{"v":"CS371","value":{"type":"course","program":1}},{"v":"CS450","value":{"type":"course","program":1}},{"v":"[CS241 CS246]+","value":{"type":"logic","logexp":["CS241","CS246"],"op":"OR"}},{"v":"CS460","value":{"type":"course","program":1}},{"v":"CS480","value":{"type":"course","program":1}},{"v":"CS490R","value":{"type":"course","program":1}},{"v":"ECEN260","value":{"type":"course","program":1}},{"v":"[ECEN160 [CS165 CS241]+]*","value":{"type":"logic","logexp":["ECEN160",["CS165","CS241"]],"op":"AND"}},{"v":"ECEN361","value":{"type":"course","program":1}},{"v":"CS398","value":{"type":"course","program":2}},{"v":"CS498R","value":{"type":"course","program":2}},{"v":"CS499","value":{"type":"course","program":3}},{"v":"[CS364 CS416 CS432]+","value":{"type":"logic","logexp":["CS364","CS416","CS432"],"op":"OR"}},{"v":"CS499A","value":{"type":"course","program":3}},{"v":"CS499B","value":{"type":"course","program":3}}],"edges":[{"v":"CS124","w":"CS165","value":{"type":"pre"}},{"v":"CS165","w":"CS235","value":{"type":"pre"}},{"v":"CS124","w":"ECEN160","value":{"type":"pre"}},{"v":"[CS165 CS241]+","w":"CS213","value":{"type":"pre"}},{"v":"CS165","w":"[CS165 CS241]+","value":{"type":"pre"}},{"v":"CS241","w":"[CS165 CS241]+","value":{"type":"pre"}},{"v":"[CS101 CS124]+","w":"CS241","value":{"type":"pre"}},{"v":"CS101","w":"[CS101 CS124]+","value":{"type":"pre"}},{"v":"CS124","w":"[CS101 CS124]+","value":{"type":"pre"}},{"v":"[CS165 CS241]+","w":"CS237","value":{"type":"pre"}},{"v":"CS237","w":"CS238","value":{"type":"pre"}},{"v":"[CS165 CS241]+","w":"CS246","value":{"type":"pre"}},{"v":"[CS235 CS237]*","w":"CS306","value":{"type":"pre"}},{"v":"CS235","w":"[CS235 CS237]*","value":{"type":"pre"}},{"v":"CS237","w":"[CS235 CS237]*","value":{"type":"pre"}},{"v":"[CIT260 CIT336 CS165 CS241]+","w":"CS308","value":{"type":"pre"}},{"v":"CIT260","w":"[CIT260 CIT336 CS165 CS241]+","value":{"type":"pre"}},{"v":"CIT160","w":"CIT260","value":{"type":"pre"}},{"v":"CIT336","w":"[CIT260 CIT336 CS165 CS241]+","value":{"type":"pre"}},{"v":"CIT230","w":"CIT336","value":{"type":"pre"}},{"v":"CIT160","w":"CIT230","value":{"type":"pre"}},{"v":"CS165","w":"[CIT260 CIT336 CS165 CS241]+","value":{"type":"pre"}},{"v":"CS241","w":"[CIT260 CIT336 CS165 CS241]+","value":{"type":"pre"}},{"v":"ECEN324","w":"CS345","value":{"type":"pre"}},{"v":"[ECEN160 [CS235 CS241]+]*","w":"ECEN324","value":{"type":"pre"}},{"v":"ECEN160","w":"[ECEN160 [CS235 CS241]+]*","value":{"type":"pre"}},{"v":"[CS235 CS241]+","w":"[ECEN160 [CS235 CS241]+]*","value":{"type":"pre"}},{"v":"CS235","w":"[CS235 CS241]+","value":{"type":"pre"}},{"v":"CS241","w":"[CS235 CS241]+","value":{"type":"pre"}},{"v":"CS308","w":"CS364","value":{"type":"pre"}},{"v":"CS308","w":"CS416","value":{"type":"pre"}},{"v":"CS308","w":"CS432","value":{"type":"pre"}},{"v":"CS308","w":"CS470","value":{"type":"pre"}},{"v":"FDMAT112","w":"MATH330","value":{"type":"pre"}},{"v":"[MATH109 MATH111]+","w":"FDMAT112","value":{"type":"pre"}},{"v":"MATH109","w":"[MATH109 MATH111]+","value":{"type":"pre"}},{"v":"MATH101","w":"MATH109","value":{"type":"pre"}},{"v":"MATH111","w":"[MATH109 MATH111]+","value":{"type":"pre"}},{"v":"[MATH101 MATH110X]*","w":"MATH111","value":{"type":"pre"}},{"v":"MATH101","w":"[MATH101 MATH110X]*","value":{"type":"pre"}},{"v":"MATH110X","w":"[MATH101 MATH110X]*","value":{"type":"pre"}},{"v":"[]+","w":"MATH110X","value":{"type":"pre"}},{"v":"FDMAT112","w":"MATH341","value":{"type":"pre"}},{"v":"PH121","w":"PH150","value":{"type":"co"}},{"v":"FDMAT112","w":"PH121","value":{"type":"co"}},{"v":"[CIT160 CS124]+","w":"CS225","value":{"type":"pre"}},{"v":"CIT160","w":"[CIT160 CS124]+","value":{"type":"pre"}},{"v":"CS124","w":"[CIT160 CS124]+","value":{"type":"pre"}},{"v":"CS235","w":"CS312","value":{"type":"pre"}},{"v":"[CIT336 CS213]+","w":"CS313","value":{"type":"pre"}},{"v":"CIT336","w":"[CIT336 CS213]+","value":{"type":"pre"}},{"v":"CS213","w":"[CIT336 CS213]+","value":{"type":"pre"}},{"v":"[CIT260 CS246]+","w":"CS313","value":{"type":"co"}},{"v":"CIT260","w":"[CIT260 CS246]+","value":{"type":"co"}},{"v":"CS246","w":"[CIT260 CS246]+","value":{"type":"co"}},{"v":"[CS241 CS246]+","w":"CS450","value":{"type":"pre"}},{"v":"CS241","w":"[CS241 CS246]+","value":{"type":"pre"}},{"v":"CS246","w":"[CS241 CS246]+","value":{"type":"pre"}},{"v":"CS246","w":"CS460","value":{"type":"pre"}},{"v":"CS306","w":"CS480","value":{"type":"pre"}},{"v":"[ECEN160 [CS165 CS241]+]*","w":"ECEN260","value":{"type":"pre"}},{"v":"ECEN160","w":"[ECEN160 [CS165 CS241]+]*","value":{"type":"pre"}},{"v":"[CS165 CS241]+","w":"[ECEN160 [CS165 CS241]+]*","value":{"type":"pre"}},{"v":"ECEN260","w":"ECEN361","value":{"type":"pre"}},{"v":"CS308","w":"CS398","value":{"type":"pre"}},{"v":"CS398","w":"CS498R","value":{"type":"pre"}},{"v":"[CS364 CS416 CS432]+","w":"CS499","value":{"type":"pre"}},{"v":"CS364","w":"[CS364 CS416 CS432]+","value":{"type":"pre"}},{"v":"CS416","w":"[CS364 CS416 CS432]+","value":{"type":"pre"}},{"v":"CS432","w":"[CS364 CS416 CS432]+","value":{"type":"pre"}},{"v":"[CS364 CS416 CS432]+","w":"CS499A","value":{"type":"pre"}},{"v":"CS499A","w":"CS499B","value":{"type":"pre"}}]}
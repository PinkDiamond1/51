const createSTPEngine=function(e){const{bank:t,parseCurl:c,restEngine:s}=e;!async function e(){!async function(){const e=(new Date).getTime();for(const n of t.customers)if("created"===n.status&&e-new Date(n.createdAt).getTime()>1e4){const e="curl "+n.url+" -u stp.engine -Xpatch -dstatus=active",t=c(e);console.log(t),await s.executeRequest(t)}for(const n of t.payments)if("created"===n.status&&e-new Date(n.createdAt).getTime()>1e4){const e="curl "+n.url+" -u stp.engine -Xpatch -dstatus=completed",t=c(e);await s.executeRequest(t)}for(const n of t.accounts)if("created"===n.status&&e-new Date(n.createdAt).getTime()>1e4){const e="curl "+n.url+" -u stp.engine -Xpatch -dstatus=active",t=c(e);await s.executeRequest(t)}}(),setTimeout(e,1e4)}()};
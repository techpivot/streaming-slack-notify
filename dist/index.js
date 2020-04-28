module.exports=function(e,t){"use strict";var r={};function __webpack_require__(t){if(r[t]){return r[t].exports}var n=r[t]={i:t,l:false,exports:{}};e[t].call(n.exports,n,n.exports,__webpack_require__);n.l=true;return n.exports}__webpack_require__.ab=__dirname+"/";function startup(){return __webpack_require__(539)}t(__webpack_require__);return startup()}({211:function(e){e.exports=require("https")},539:function(e,t,r){"use strict";r.r(t);var n=r(211);var o=r.n(n);var s=r(835);var u=r.n(s);function getInput(e,t={}){const r=(process.env[`INPUT_${e.replace(/ /g,"_").toUpperCase()}`]||"").trim();if(t&&t.required&&r.length===0){throw new Error(`Input required and not supplied: ${e}`)}return r}function printHttpError(e,t=null,r=null){console.error(`ERROR: Unable to post message to Slack${e!==null?": "+e:""}\n`);console.error(`Response Code: ${t}`);console.error(`Response Body: ${r}`)}const a=(e,t)=>{return new Promise((r,n)=>{const s=o().request(e,e=>{let t="";e.on("data",e=>{t+=e});e.on("end",()=>{if(e.statusCode!==200){printHttpError(t,e.statusCode,t);process.exit(1)}try{const e=JSON.parse(t);if(e.ok){r(e)}else if(e.error){n(`Slack Error: ${e.error}`)}else{n(`Unable to post message: ${t}`)}}catch(e){n(`Unable to parse response body as JSON: ${t}`)}})});s.on("error",e=>{printHttpError(e.message||e);n(e.message||e);process.exit(1)});s.write(t);s.end()})};const c=async e=>{const t=JSON.stringify(e);const r=u().parse("https://slack.com//api/chat.postMessage");const n={hostname:r.hostname,port:r.port,path:r.pathname,method:"POST",headers:{Authorization:`Bearer ${process.env.SLACK_ACCESS_TOKEN}`,"Content-Type":"application/json; charset=utf-8","Content-Length":t.length}};return await a(n,t)};async function run(){try{if(!process.env.SLACK_ACCESS_TOKEN){throw new Error(`\nNo SLACK_ACCESS_TOKEN secret defined.\n\n  1) Navigate to Repository > Settings > Secrets and add SLACK_ACCESS_TOKEN secret\n  2) Update Github workflow file (e.g.  ./github/workflows/main.yml) to include:\n      env:\n        SLACK_ACCESS_TOKEN: \${{ secrets.SLACK_ACCESS_TOKEN }}\n      `)}const e=getInput("channel",{required:true});const t=getInput("ts");console.log("channel: "+e);console.log("ts: "+t);const r={channel:getInput("channel",{required:true}),text:"replaceme",username:getInput("username"),icon_url:getInput("icon_url")};c(r).then(e=>{console.log(`::set-output name=channel::${e.channel}`);console.log(`::set-output name=ts::${e.ts}`);console.log(`Xet-output name=channel::${e.channel}`);console.log(`Xet-output name=ts::${e.ts}`)}).catch(e=>{console.error(e);process.exit(1)})}catch(e){console.error(e.message||e);process.exit(1)}}run()},835:function(e){e.exports=require("url")}},function(e){"use strict";!function(){e.r=function(e){if(typeof Symbol!=="undefined"&&Symbol.toStringTag){Object.defineProperty(e,Symbol.toStringTag,{value:"Module"})}Object.defineProperty(e,"__esModule",{value:true})}}();!function(){var t=Object.prototype.hasOwnProperty;e.d=function(e,r,n){if(!t.call(e,r)){Object.defineProperty(e,r,{enumerable:true,get:n})}}}();!function(){e.t=function(t,r){if(r&1)t=this(t);if(r&8)return t;if(r&4&&typeof t==="object"&&t&&t.__esModule)return t;var n=Object.create(null);e.r(n);Object.defineProperty(n,"default",{enumerable:true,value:t});if(r&2&&typeof t!="string")for(var o in t)e.d(n,o,function(e){return t[e]}.bind(null,o));return n}}();!function(){e.n=function(t){var r=t&&t.__esModule?function getDefault(){return t["default"]}:function getModuleExports(){return t};e.d(r,"a",r);return r}}()});
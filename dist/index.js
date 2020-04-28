module.exports=function(e,t){"use strict";var n={};function __webpack_require__(t){if(n[t]){return n[t].exports}var r=n[t]={i:t,l:false,exports:{}};e[t].call(r.exports,r,r.exports,__webpack_require__);r.l=true;return r.exports}__webpack_require__.ab=__dirname+"/";function startup(){return __webpack_require__(689)}t(__webpack_require__);return startup()}({211:function(e){e.exports=require("https")},689:function(e,t,n){"use strict";n.r(t);const r=`\nNo SLACK_ACCESS_TOKEN secret defined.\n\n  1) Navigate to Repository > Settings > Secrets and add SLACK_ACCESS_TOKEN secret\n  2) Update Github workflow file (e.g.  ./github/workflows/main.yml) to include:\n      env:\n        SLACK_ACCESS_TOKEN: \${{ secrets.SLACK_ACCESS_TOKEN }}\n`;const o="Execution runtime";var s=n(211);var u=n.n(s);var a=n(835);var c=n.n(a);function getInput(e,t={}){const n=(process.env[`INPUT_${e.replace(/ /g,"_").toUpperCase()}`]||"").trim();if(t&&t.required&&n.length===0){throw new Error(`Input required and not supplied: ${e}`)}return n}function printHttpError(e,t=null,n=null){console.error(`ERROR: Unable to post message to Slack${e!==null?": "+e:""}\n`);console.error(`Response Code: ${t}`);console.error(`Response Body: ${n}`)}const i=(e,t)=>{const n=JSON.stringify(t);const r=c().parse(`https://slack.com//api/${e}`);const o={hostname:r.hostname,port:r.port,path:r.pathname,method:"POST",headers:{Authorization:`Bearer ${process.env.SLACK_ACCESS_TOKEN}`,"Content-Type":"application/json; charset=utf-8","Content-Length":n.length}};return new Promise((e,t)=>{const r=u().request(o,n=>{let r="";n.on("data",e=>{r+=e});n.on("end",()=>{if(n.statusCode!==200){printHttpError(r,n.statusCode,r);process.exit(1)}try{const n=JSON.parse(r);if(n.ok){e(n)}else if(n.error){let e=n.error;if(n.response_metadata&&n.response_metadata.messages){e+=`: ${n.response_metadata.messages[0]}`}t(`Slack Error: ${e}`)}else{t(`Unable to post message: ${r}`)}}catch(e){t(`Unable to parse response body as JSON: ${r}`)}})});r.on("error",e=>{printHttpError(e.message||e);t(e.message||e);process.exit(1)});r.write(n);r.end()})};const p=async(e,t)=>{return await i(e,t)};async function run(){console.time(o);try{if(!process.env.SLACK_ACCESS_TOKEN){throw new Error(r)}const e=getInput("channel",{required:true});const t=getInput("ts");const n=!t?"chat.postMessage":"chat.update";const s={channel:getInput("channel",{required:true})};if(t){s.ts=t;s.text="REPLACEME NEW"}else{s.as_user=false;s.text="replaceme";s.title=`${process.env.GITHUB_REPOSITORY}`;s.title_link=`https://github.com/${process.env.GITHUB_REPOSITORY}`;s.author_name=`${process.env.GITHUB_ACTOR}`;s.author_link=`https://github.com/${process.env.GITHUB_ACTOR}`;s.author_icon=`https://github.com/${process.env.GITHUB_ACTOR}.png`;s.username=getInput("username");s.icon_emoji="thumbsup"}await p(n,s).then(t=>{console.log(`::set-output name=channel::${t.channel}`);console.log(`::set-output name=ts::${t.ts}`);console.log(`'Successfully sent "${n}" payload for channel: ${e}`)}).catch(e=>{console.error(e);process.exit(1)})}catch(e){console.error(e.message||e);process.exit(1)}finally{console.timeEnd(o)}}run()},835:function(e){e.exports=require("url")}},function(e){"use strict";!function(){e.r=function(e){if(typeof Symbol!=="undefined"&&Symbol.toStringTag){Object.defineProperty(e,Symbol.toStringTag,{value:"Module"})}Object.defineProperty(e,"__esModule",{value:true})}}();!function(){var t=Object.prototype.hasOwnProperty;e.d=function(e,n,r){if(!t.call(e,n)){Object.defineProperty(e,n,{enumerable:true,get:r})}}}();!function(){e.t=function(t,n){if(n&1)t=this(t);if(n&8)return t;if(n&4&&typeof t==="object"&&t&&t.__esModule)return t;var r=Object.create(null);e.r(r);Object.defineProperty(r,"default",{enumerable:true,value:t});if(n&2&&typeof t!="string")for(var o in t)e.d(r,o,function(e){return t[e]}.bind(null,o));return r}}();!function(){e.n=function(t){var n=t&&t.__esModule?function getDefault(){return t["default"]}:function getModuleExports(){return t};e.d(n,"a",n);return n}}()});
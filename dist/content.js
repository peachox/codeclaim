chrome.runtime.onMessage.addListener((e,s,n)=>{e.type==="START_CLAIMS"&&window.postMessage({type:"START_CLAIMS"},"*"),e.type==="STOP_CLAIMS"&&window.postMessage({type:"STOP_CLAIMS"},"*")});

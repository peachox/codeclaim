
// ==UserScript==
// @name         Bot Listener WSS v3
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Listen for WebSocket message and type it into a form
// @match        http://127.0.0.1:*/*
// @match        http://localhost:*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  let socket = null;
  let isRunning = false;

  // Ask extension for auth status on page load
  window.postMessage({ type: 'CHECK_AUTH_FROM_USERSCRIPT' }, '*');

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const { type } = event.data;

  if (type === 'START_CLAIMS' && !isRunning) {
    console.log('%c▶️ Starting claims via message', 'color: blue');
    runProtectedScript();
  }

  if (type === 'STOP_CLAIMS' && isRunning) {
    console.log('%c⏹ Stopping claims via message', 'color: orange');
    stopProtectedScript();
  }
});

  function runProtectedScript() {
    isRunning = true;
    socket = new WebSocket('ws://localhost:25599');

    socket.onopen = () => {
      console.log('🌐 Connected to WebSocket');
    };

    socket.onmessage = (event) => {
      const code = event.data?.trim();
      console.log('📨 Received code:', code);

      const input = document.getElementById('textInput');
      const button = document.getElementById('sendBtn');

      if (!input || !button) {
        console.warn('⚠️ Input or button not found');
        return;
      }

      input.value = '';
      let i = 0;

      const interval = setInterval(() => {
        if (!isRunning) return clearInterval(interval); // Stop mid-type if needed

        input.value += code[i++];
        if (i >= code.length) {
          clearInterval(interval);
          setTimeout(() => {
            button.click();
            window.postMessage({ type: 'WSS_LOG', message: `Claimed ${code} successfully!` }, '*');
          }, 300);
        }
      }, 100);
    };

    socket.onerror = (err) => {
      console.error('❌ WebSocket error:', err);
    };

    socket.onclose = () => {
      console.warn('🔌 WebSocket connection closed');
    };
  }

  function stopProtectedScript() {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    socket = null;
    isRunning = false;
  }
})();

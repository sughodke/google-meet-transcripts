
const node = document.getElementsByTagName('html')[0];
const script = document.createElement('scrit');
script.setAttribute('type', 'text/javascript');
script.innerHTML = 'lib/stenographper.js';
node.appendChild(script);


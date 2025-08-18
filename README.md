# Module Name
 - __dist/core__ - core module output
 - __dist/ppweb__ - p2p datachannel for browser
 - __dist/wsnode__ - websocket client for nodejs
 - __dist/wsweb__ - websocket cleint for browser

# How To Enable PPTP

Step 1: edit /config/core.51001.ini

Step 2: plus pptp setting
```ini
[extension.core.pptp]
enable=false|true
peer_id=pptp://my-app/<target-you-specific>
signal_server=wss://<signal_server_ip>:<port>
ice_servers[]=stun:stun.l.google.com:19302
ice_servers[]=stun:stun1.l.google.com:19302
ice_servers[]=stun:stun2.l.google.com:19302
ice_servers[]=stun:stun3.l.google.com:19302
ice_servers[]=stun:stun4.l.google.com:19302
```

# How To Use Websocket Client Plugin

STEP 1: define your ./config/core.51001.ini
```ini
[plugin.ws.target1]
host=ws://127.0.0.1:2881

[plugin.ws.target2]
host=ws://127.0.0.1:2882
```

STEP 2: sample code for developer
```javascript
const t1 = context.utils.ws.target1;
const t2 = context.utils.ws.target2;
```


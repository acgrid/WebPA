## Event categories

At Source|Transport|At Destination|Console|Monitor
---|---|---|---|---
enter({channel, role})|common|enter({src, channel, role})|BCAST|TX
ping|common|heartbeat({src, role})|BCAST|TX
exit|common|exit({src})|BCAST|TX
sandbox.*({})|sandbox|sandbox.*({})|TX|RX
sync.*({})|sync|sync.*({})|TX|_Light_
env.*({})|env|env.*({src, ...})|RX|TX
promise.*({})|promise|promise.*({src, ...})|RX|TX
global.*({initial, ...data})|global|global.*({})|BCAST|-
console.*({})|-|_Identical_|LOCAL|-
plugin._NAME_.*({})|-|_Identical_|LOCAL|LOCAL
monitor.*({})|-|_Identical_|-|LOCAL
debug(...)|-|_Identical_||LOCAL

## Transport Structure
```json
{
  "name": "transported event name",
  "args": {"_src": "socket.id", "initial": true, "url": "foo"}
}
```


## Important Events
Name|Parameters|Description
---|---|---
`plugin.bridge.entered`|`Bridge`|

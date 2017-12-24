# Program Schema

```json
{
  "id": "A01",
  "session": "MY", //generated
  "index": 14,  // generated
  "name": "string",
  "clock": "HH:MM[:SS]",
  "alt": "foo",
  "actor": {
    "unit": "string",
    "person": "string",
    "performers": ["string"]
  },
  "duration": 300,
  "summary": "string",
  "songs": [
    {
      "T": 125, // Offset
      "Y": "2010",
      "N": {"ja": "", "zh-CN": ""},
      "P": {"ja": "", "zh-CN": ""},
      "L": "lyric by",
      "C": "composed by",
      "A": "arranged by",
      "V": "vocal by",
      "F": "choreograph by",
      "I": "informational stuff"
    }
  ],
  "arrange": {
    "pa": "",
    "light": [
      {"time": 51, "note": "Hello", "color": "#66CCFF"}
    ],
    "mic": [
      null, "X", "Y", null
    ],
    "remark": ""
  },
  "actions": [
    {"action": "background.push", "ext": "png"},
    {"action": "video.start", "file": "A1.mp4", "loop": false},
    {"action": "fb2k.start", "list": 0, "track": 0},
    {"action": "audio.start", "ext": "mp3"},
    {"action": "credit.start", "hidden": ["N"], "stay": 30},
    {"action": "lyric.start", "ext": "lrc"}
  ],
  "listen": {
    "video.stop": [
      {"action": "background.pop"}
    ]
  }
}
```

# Programs Packet
```json
[
  {
    "session": "IJP", 
    "prefix": "I",
    "programs": [/*programs*/]
  }
]
```

# Storage Schema
```json
{
  "_id": "ID in channel",
  "session": "",
  "index": 0,
  "program": {},
  "control": {}
}
```

# Automatic Programming with media detection

If media file in such path is found:

`Global Prefix`/`Session Prefix`/`code`*.`ext`

Program matrix will be:

Start|Stop|Image|Audio|Video
---|---|---|---|---|
None|None|×|×|×|
Image|None|√|×|×|
Play Audio|Stop|×|√|×|
Play Video|Stop|×|×|√|
Image,Play Audio|On audio stops, Unset Image|√|√|×|
Image, Play Video|On video stops, Unset Image|√|×|√|
*NG* Play Audio,Muted Video|Stop|×|√|√|
*NG* Image,Play Audio,Muted Video|On longer stops, Unset Image|√|√|√|
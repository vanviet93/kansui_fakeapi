const express = require('express');
const fs = require('fs');
const moment = require('moment');
const cors = require('cors');
const app = express();
const port = 3001;

const A = 0.68, B = 5.88, C = 0.68, D = 5.88, E = 45, F = -22.5, V0 = 2.8;

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());
// Parse JSON bodies (as sent by API clients)
app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.use(cors());

app.get("/add", (req, res) => {
  res.sendFile(__dirname + "/input.html")
})
app.get("/clear", (req, res) => {
  const data = {
    "payloadData": [],
    "paging": {
      "total": 1,
      "sort": "txTime",
      "limit": 0
    }
  }
  fs.writeFileSync('./data.json', JSON.stringify(data));
  res.send("SUCCESS");
})
app.post("/add", (req, res) => {
  const data = fs.readFileSync('./data.json', 'utf8');
  const newData = JSON.parse(data);
  const time = new Date();
  time.setHours(time.getHours() + 9);
  const tx = moment(time).format('yyyy-MM-DD HH:mm:ss');
  const {
    powerVoltage,
    innerWaterLevel,
    outerWaterLevel,
    gateOpenningLevel
  } = req.body;
  const input0 = (Math.round(parseFloat(powerVoltage)/0.5) + 0b01000000).toString(16);
  const tempInput1 = parseFloat(outerWaterLevel);
  if (tempInput1 < B) {
    res.send('川表水位MUST BE GREATER THAN B');
    return;
  }
  const input1 = Math.round((tempInput1 - B) / A * 1000).toString(16);
  const tempInput2 = parseFloat(innerWaterLevel);
  if (tempInput2 < D) {
    res.send('川裏水位MUST BE GREATER THAN D');
    return;
  }
  const input2 = Math.round((tempInput2 - D) / C * 1000).toString(16);
  let tempInput3 = (parseFloat(gateOpenningLevel) - F) / E;
  const input3 = Math.round(tempInput3 < V0? tempInput3 * 1000: (tempInput3 + V0) * 1000).toString(16);
  if (input3 < 0) {
    res.send('INPUT3 MUST BE GREATER THAN 0');
    return;
  }
  const payload = '139ad74cc93c'+
  ('0'.repeat(Math.max(2 - input0.length, 0)) + input0) + 
  '02' +  
  ('0'.repeat(Math.max(4 - input1.length, 0)) + input1) + 
  ('0'.repeat(Math.max(4 - input2.length, 0)) + input2) + 
  ('0'.repeat(Math.max(4 - input3.length, 0)) + input3) + 
  '0000'
  const newItem = {
    "txTime": tx,
    "rxTime": tx,
    "lfourId": "0001018026",
    "rssi": "2",
    "serviceTag": {
        "serviceId": "S23854554"
    },
    "payloadData": payload
  };
  newData.payloadData = [newItem];
  fs.writeFileSync('./data.json', JSON.stringify(newData));
  res.send("SUCCESS");
})
app.get("/list/:groupId", (req, res) => {
  if (req.params.groupId!=='DG0000000319') return res.json({payloadData: []});
  const data = fs.readFileSync('./data.json', 'utf8');
  res.addH
  res.json(JSON.parse(data));
})
const server = app.listen(port, () => {
  console.log("RUNNING ON PORT ", port);
});

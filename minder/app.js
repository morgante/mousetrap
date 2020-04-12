// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

// [START appengine_websockets_app]
const app = require('express')();
const bodyParser = require('body-parser');

const jsonBodyParser = bodyParser.json();

const server = require('http').Server(app);
const io = require('socket.io')(server);

const {PUBSUB_VERIFICATION_TOKEN} = process.env;

io.on('connection', (socket) => {
  socket.on('start-session', (session) => {
    console.log('joining', session);
    socket.join(session);
  });
  socket.on('datum', (data) => {
    io.emit('datum', data);
    io.to(`cool-sess`).emit('datum', 'cool session');
  });
});

// //Increase roomno 2 clients are present in a room.
// if(io.nsps['/'].adapter.rooms["room-"+roomno] && io.nsps['/'].adapter.rooms["room-"+roomno].length > 1) roomno++;
// socket.join("room-"+roomno);

// //Send this event to everyone in the room.
// io.sockets.in("room-"+roomno).emit('connectToRoom', "You are in room no. "+roomno);

app.post('/pubsub/push', jsonBodyParser, (req, res) => {
  if (req.query.token !== PUBSUB_VERIFICATION_TOKEN) {
    res.status(400).send();
    return;
  }

  // The message is a unicode string encoded in base64.
  const message = JSON.parse(Buffer.from(req.body.message.data, 'base64').toString(
    'utf-8'
  ));

  console.log('received message', req.body, message);

  io.to(`${message.session}`).emit('datum', message.data);

  res.status(200).send();
});

if (module === require.main) {
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
  });
}
// [END appengine_websockets_app]

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
  });
});

function extractEvent(message) {
  if (message.kind === 'storage#object' && message.name) {
    const regex = /sessions\/(.+)\/balls\/(.+).json/;
    const matches = message.name.match(regex);
    if (matches) {
      const session = matches[1];
      return {
        session: session,
        data: {
          event: "storage_done",
          ball: {
            session: session,
            id: matches[2]
          }
        }
      }
    }
  }
  return message;
}

app.post('/pubsub/push', jsonBodyParser, (req, res) => {
  if (req.query.token !== PUBSUB_VERIFICATION_TOKEN) {
    res.status(400).send();
    return;
  }

  // The message is a unicode string encoded in base64.
  const message = JSON.parse(Buffer.from(req.body.message.data, 'base64').toString(
    'utf-8'
  ));

  const event = extractEvent(message);

  console.log('received message', req.body, message, event);

  if (event && event.session) {
    io.to(`${event.session}`).emit('datum', event.data);
  }

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

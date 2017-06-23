var Pusher = require('pusher');

var pusher = new Pusher({
  appId: '357504',
  key: 'b238d890f5ce582a1916',
  secret: '8d4b8b4f4fcf029757b3',
  cluster: 'eu',
  encrypted: true
});

pusher.trigger('my-channel', 'my-event', {
  "message": "hello world"
});
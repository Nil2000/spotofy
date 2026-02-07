// will be having only ws server
// upvote songs
// request to add songs
// approve songs by only admin
// list queue of songs(should provide real time song list updates)

Bun.serve({
  port: 3001,
  websocket: {
    message(ws, message) {
      console.log(message);
    }, // a message is received
    open(ws) {
      console.log("connection started");
    }, // a socket is opened
    close(ws, code, message) {
      console.log("connection closed");
    }, // a socket is closed
    drain(ws) {
      console.log("drain");
    }, // the socket is ready to receive more data
  },
  fetch(req, server) {
    // upgrade the request to a WebSocket
    if (server.upgrade(req)) {
      return; // do not return a Response
    }
    return new Response("Upgrade failed", { status: 500 });
  },
});

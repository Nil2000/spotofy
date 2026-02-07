const server = Bun.serve({
  port: 3001,
  routes: {
    "/": () => new Response("Hello from room server!"),
  },
});

console.log(`Listening on ${server.url}`);

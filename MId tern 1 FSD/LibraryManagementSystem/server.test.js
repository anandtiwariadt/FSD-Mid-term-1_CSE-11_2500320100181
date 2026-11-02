const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const app = require("./server");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/books`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

function request(path, method, body) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

test("supports validated book creation, lookup, update, and deletion", async () => {
  const book = {
    id: 101,
    title: "Java Programming",
    author: "Herbert Schildt",
    category: "Programming",
    quantity: 5,
    available: 5,
  };

  let response = await request("", "POST", { ...book, quantity: -1 });
  assert.equal(response.status, 400);

  response = await request("", "POST", book);
  assert.equal(response.status, 201);
  assert.equal((await response.json()).book.id, book.id);

  response = await request("", "POST", book);
  assert.equal(response.status, 409);

  response = await request("", "GET");
  assert.deepEqual(await response.json(), [book]);

  response = await request("/101", "GET");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).title, book.title);

  response = await request("/101", "PUT", { available: 3 });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).book.available, 3);

  response = await request("/101", "DELETE");
  assert.equal(response.status, 200);

  response = await request("/101", "GET");
  assert.equal(response.status, 404);
});

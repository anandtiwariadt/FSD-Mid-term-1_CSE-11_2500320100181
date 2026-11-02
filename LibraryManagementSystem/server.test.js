
const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const app = require("./server");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  baseUrl = `http://127.0.0.1:${server.address().port}/api/books`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});

function request(path, method, body) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers:
      body === undefined
        ? {}
        : { "Content-Type": "application/json" },
    body:
      body === undefined
        ? undefined
        : JSON.stringify(body),
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


  let response = await request("", "GET");
  assert.equal(response.status, 200);

  const initialBooks = await response.json();

  response = await request("", "POST", {
    ...book,
    quantity: -1,
  });
  assert.equal(response.status, 400);

  response = await request("", "POST", book);
  assert.equal(response.status, 201);
  assert.deepEqual((await response.json()).book, book);

  response = await request("", "POST", book);
  assert.equal(response.status, 409);

  response = await request("", "GET");
  assert.equal(response.status, 200);

  const allBooks = await response.json();

  assert.equal(allBooks.length, initialBooks.length + 1);
  assert.ok(allBooks.some((item) => item.id === 101));


  response = await request("/101", "GET");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).title, book.title);

 
  response = await request("/search?title=java", "GET");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).length, 1);


  response = await request("/search", "GET");
  assert.equal(response.status, 400);


  response = await request("/101", "PUT", {
    available: 3,
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).book.available, 3);


  response = await request("/101", "POST");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).book.available, 2);


  response = await request("/101/return", "POST");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).book.available, 3);

  
  for (let available = 2; available >= 0; available--) {
    response = await request("/101", "POST");
    assert.equal(response.status, 200);
    assert.equal((await response.json()).book.available, available);
  }

  
  response = await request("/101", "POST");
  assert.equal(response.status, 409);


  for (let available = 1; available <= book.quantity; available++) {
    response = await request("/101/return", "POST");
    assert.equal(response.status, 200);
    assert.equal((await response.json()).book.available, available);
  }

  
  response = await request("/101/return", "POST");
  assert.equal(response.status, 409);

  
  response = await request("/101", "DELETE");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).book.id, 101);

  
  response = await request("/101", "GET");
  assert.equal(response.status, 404);
});

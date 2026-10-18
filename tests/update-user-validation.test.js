const test = require("node:test");
const assert = require("node:assert");
const request = require("supertest");

const app = require("../server");

const ERROR = "name and email are required and must be non-empty strings";

async function createUser() {
  const res = await request(app)
    .post("/users")
    .send({ name: "Katherine Johnson", email: "katherine@example.com" });
  return res.body;
}

for (const [label, body] of [
  ["name is not a string", { name: 42, email: "a@example.com" }],
  ["email is not a string", { name: "A", email: ["a@example.com"] }],
  ["name is empty", { name: "", email: "a@example.com" }],
  ["name is whitespace only", { name: "   ", email: "a@example.com" }],
  ["email is whitespace only", { name: "A", email: "\t\n" }],
  ["body is empty", {}],
]) {
  test(`PUT /users/:id returns 400 when ${label}`, async () => {
    const user = await createUser();

    const res = await request(app).put(`/users/${user.id}`).send(body);

    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(res.body, { error: ERROR });
  });
}

test("PUT /users/:id returns 400 when no body is sent at all", async () => {
  const user = await createUser();

  const res = await request(app).put(`/users/${user.id}`);

  assert.strictEqual(res.status, 400);
});

test("PUT /users/:id does not change the user when validation fails", async () => {
  const user = await createUser();

  await request(app).put(`/users/${user.id}`).send({ name: "Changed" });
  const res = await request(app).get(`/users/${user.id}`);

  assert.deepStrictEqual(res.body, user);
});

test("PUT /users/:id returns the route's 404 body for an unknown id", async () => {
  const res = await request(app)
    .put("/users/9999")
    .send({ name: "Nobody", email: "nobody@example.com" });

  assert.strictEqual(res.status, 404);
  assert.deepStrictEqual(res.body, { error: "User not found" });
});

test("PUT /users/:id validates the body before looking up the user", async () => {
  const res = await request(app).put("/users/9999").send({ name: "Nobody" });

  assert.strictEqual(res.status, 400);
});

test("PUT /users/:id ignores an id in the body", async () => {
  const user = await createUser();

  const res = await request(app)
    .put(`/users/${user.id}`)
    .send({ id: 12345, name: "K. Johnson", email: "kj@example.com" });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.id, user.id);
  assert.strictEqual((await request(app).get("/users/12345")).status, 404);
});

test("PUT /users/:id persists the update", async () => {
  const user = await createUser();

  await request(app)
    .put(`/users/${user.id}`)
    .send({ name: "K. Johnson", email: "kj@example.com" });
  const res = await request(app).get(`/users/${user.id}`);

  assert.deepStrictEqual(res.body, { id: user.id, name: "K. Johnson", email: "kj@example.com" });
});

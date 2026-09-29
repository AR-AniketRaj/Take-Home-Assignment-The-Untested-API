const request = require("supertest");
const app = require("../src/app");
const taskService = require("../src/services/taskService");

describe("Task API", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("GET /tasks should return 200", async () => {
    const response = await request(app).get("/tasks");

    expect(response.statusCode).toBe(200);
  });

  test("GET /tasks should return an empty array when there are no tasks", async () => {
    const response = await request(app).get("/tasks");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("POST /tasks should create a new task", async () => {
    const response = await request(app).post("/tasks").send({
      title: "API Testing",
      description: "integration tests",
      status: "todo",
      priority: "high",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe("API Testing");
    expect(response.body.description).toBe("integration tests");
    expect(response.body.status).toBe("todo");
    expect(response.body.priority).toBe("high");
    expect(response.body.id).toBeDefined();
  });

  test("POST /tasks should return 400 when title is missing", async () => {
    const response = await request(app).post("/tasks").send({
      description: "Task without title",
      status: "todo",
      priority: "medium",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  test("GET /tasks?status=todo should return only todo tasks", async () => {
    await request(app).post("/tasks").send({
      title: "Todo Task",
      status: "todo",
    });

    await request(app).post("/tasks").send({
      title: "Done Task",
      status: "done",
    });

    const response = await request(app).get("/tasks?status=todo");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe("Todo Task");
    expect(response.body[0].status).toBe("todo");
  });

  test("GET /tasks?page=1&limit=2 should return the first page", async () => {
    await request(app).post("/tasks").send({ title: "Task 1" });

    await request(app).post("/tasks").send({ title: "Task 2" });

    await request(app).post("/tasks").send({ title: "Task 3" });

    const response = await request(app).get("/tasks?page=1&limit=2");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].title).toBe("Task 1");
    expect(response.body[1].title).toBe("Task 2");
  });

  test("GET /tasks/stats should return correct task statistics", async () => {
    await request(app).post("/tasks").send({
      title: "Todo Task 1",
      status: "todo",
    });

    await request(app).post("/tasks").send({
      title: "Todo Task 2",
      status: "todo",
    });

    await request(app).post("/tasks").send({
      title: "Progress Task",
      status: "in_progress",
    });

    await request(app).post("/tasks").send({
      title: "Completed Task",
      status: "done",
    });

    const response = await request(app).get("/tasks/stats");

    expect(response.statusCode).toBe(200);
    expect(response.body.todo).toBe(2);
    expect(response.body.in_progress).toBe(1);
    expect(response.body.done).toBe(1);
    expect(response.body.overdue).toBe(0);
  });

  test("GET /tasks/stats should count unfinished overdue tasks", async () => {
    await request(app).post("/tasks").send({
      title: "Overdue Task",
      status: "todo",
      dueDate: "2020-01-01T00:00:00.000Z",
    });

    await request(app).post("/tasks").send({
      title: "Completed Old Task",
      status: "done",
      dueDate: "2020-01-01T00:00:00.000Z",
    });

    const response = await request(app).get("/tasks/stats");

    expect(response.statusCode).toBe(200);
    expect(response.body.overdue).toBe(1);
  });

  test("PUT /tasks/:id should update an existing task", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Original Task",
      status: "todo",
      priority: "medium",
    });

    const taskId = createResponse.body.id;

    const response = await request(app).put(`/tasks/${taskId}`).send({
      title: "Updated Task",
      status: "in_progress",
      priority: "high",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(taskId);
    expect(response.body.title).toBe("Updated Task");
    expect(response.body.status).toBe("in_progress");
    expect(response.body.priority).toBe("high");
  });

  test("PUT /tasks/:id should return 404 when task does not exist", async () => {
    const response = await request(app).put("/tasks/non-existing-id").send({
      title: "Updated Task",
    });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Task not found");
  });

  test("DELETE /tasks/:id should delete an existing task", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Task to delete",
    });

    const taskId = createResponse.body.id;

    const response = await request(app).delete(`/tasks/${taskId}`);

    expect(response.statusCode).toBe(204);

    const getResponse = await request(app).get("/tasks");

    expect(getResponse.body).toEqual([]);
  });

  test("DELETE /tasks/:id should return 404 when task does not exist", async () => {
    const response = await request(app).delete("/tasks/non-existing-id");

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Task not found");
  });

  test("PATCH /tasks/:id/complete should complete an existing task", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Task to complete",
      status: "todo",
      priority: "high",
    });

    const taskId = createResponse.body.id;

    const response = await request(app).patch(`/tasks/${taskId}/complete`);

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(taskId);
    expect(response.body.status).toBe("done");
    expect(response.body.priority).toBe("medium");
    expect(response.body.completedAt).not.toBeNull();
  });

  test("PATCH /tasks/:id/complete should return 404 when task does not exist", async () => {
    const response = await request(app).patch(
      "/tasks/non-existing-id/complete",
    );

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Task not found");
  });

  test("PATCH /tasks/:id/assign should assign a task", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Task to assign",
    });

    const taskId = createResponse.body.id;

    const response = await request(app).patch(`/tasks/${taskId}/assign`).send({
      assignee: "Aniket",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(taskId);
    expect(response.body.assignee).toBe("Aniket");
  });

  test("PATCH /tasks/:id/assign should return 404 for missing task", async () => {
    const response = await request(app)
      .patch("/tasks/non-existent-id/assign")
      .send({
        assignee: "Aniket",
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Task not found");
  });

  test("PATCH /tasks/:id/assign should return 400 for empty assignee", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Task with empty assignee",
    });

    const taskId = createResponse.body.id;

    const response = await request(app).patch(`/tasks/${taskId}/assign`).send({
      assignee: "",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Assignee is required");
  });

  test("PATCH /tasks/:id/assign should return 409 if task is already assigned", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Already assigned task",
    });

    const taskId = createResponse.body.id;

    await request(app).patch(`/tasks/${taskId}/assign`).send({
      assignee: "Aniket",
    });

    const response = await request(app).patch(`/tasks/${taskId}/assign`).send({
      assignee: "Rahul",
    });

    expect(response.statusCode).toBe(409);
    expect(response.body.error).toBe("Task already assigned");
  });

  test("PATCH /tasks/:id/assign should return 400 when assignee is missing", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Task without assignee",
    });

    const taskId = createResponse.body.id;

    const response = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Assignee is required");
  });

  test("PATCH /tasks/:id/assign should return 400 when assignee is not a string", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Task with invalid assignee",
    });

    const taskId = createResponse.body.id;

    const response = await request(app).patch(`/tasks/${taskId}/assign`).send({
      assignee: 123,
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Assignee is required");
  });

  test("GET /tasks/stats should return all zeroes when there are no tasks", async () => {
    const response = await request(app).get("/tasks/stats");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      todo: 0,
      in_progress: 0,
      done: 0,
      overdue: 0,
    });
  });

  test("POST /tasks should return 400 for invalid status or priority", async () => {
    const response = await request(app).post("/tasks").send({
      title: "Bad Task",
      status: "super-urgent",
      priority: "extreme",
    });

    expect(response.statusCode).toBe(400);
  });

  test("PUT /tasks/:id should not allow overwriting 'id' or 'createdAt'", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Immutable Task",
      status: "todo",
      priority: "medium",
    });

    const originalId = createResponse.body.id;
    const originalCreatedAt = createResponse.body.createdAt;

    const response = await request(app).put(`/tasks/${originalId}`).send({
      title: "Updated Immutable Task",
      status: "in_progress",
      priority: "high",
      id: "fake-uuid-123",
      createdAt: "2020-01-01T00:00:00.000Z",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(originalId); 
    expect(response.body.createdAt).toBe(originalCreatedAt); 
  });

  test("GET /tasks?page=5&limit=2 should return an empty array if out of bounds", async () => {
    await request(app).post("/tasks").send({ title: "Task 1" });
    await request(app).post("/tasks").send({ title: "Task 2" });

    const response = await request(app).get("/tasks?page=5&limit=2");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("GET /tasks?page=0&limit=abc should handle invalid pagination gracefully", async () => {
    await request(app).post("/tasks").send({ title: "Task 1" });

    const response = await request(app).get("/tasks?page=0&limit=abc");

    expect(response.statusCode).not.toBe(500);
  });
});

const taskService = require("../src/services/taskService");

describe("Task Service - create()", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should create a task with the provided data", () => {
    const task = taskService.create({
      title: "Jest",
      description: "unit testing",
      status: "todo",
      priority: "high",
      dueDate: null,
    });

    expect(task.title).toBe("Jest");
    expect(task.description).toBe("unit testing");
    expect(task.status).toBe("todo");
    expect(task.priority).toBe("high");
    expect(task.dueDate).toBeNull();
  });
});

test("should apply default values when optional fields are missing", () => {
  const task = taskService.create({
    title: "Node.js",
  });

  expect(task.title).toBe("Node.js");
  expect(task.description).toBe("");
  expect(task.status).toBe("todo");
  expect(task.priority).toBe("medium");
  expect(task.dueDate).toBeNull();
  expect(task.completedAt).toBeNull();
  expect(task.id).toBeDefined();
  expect(task.createdAt).toBeDefined();
});

describe("Task Service - getAll()", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should return all created tasks", () => {
    taskService.create({
      title: "Task 1",
    });

    taskService.create({
      title: "Task 2",
    });

    const tasks = taskService.getAll();

    expect(tasks).toHaveLength(2);
    expect(tasks[0].title).toBe("Task 1");
    expect(tasks[1].title).toBe("Task 2");
  });

  test("should return an empty array when there are no tasks", () => {
    const tasks = taskService.getAll();

    expect(tasks).toEqual([]);
  });
});

describe("Task Service - findById()", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should return a task when the ID exists", () => {
    const createdTask = taskService.create({
      title: "Supertest",
    });

    const task = taskService.findById(createdTask.id);

    expect(task).toBeDefined();
    expect(task.id).toBe(createdTask.id);
    expect(task.title).toBe("Supertest");
  });

  test("should return undefined when the ID does not exist", () => {
    const task = taskService.findById("non-existing-id");

    expect(task).toBeUndefined();
  });
});

describe("Task Service - getByStatus()", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should return tasks matching the requested status", () => {
    taskService.create({
      title: "Task 1",
      status: "todo",
    });

    taskService.create({
      title: "Task 2",
      status: "done",
    });

    taskService.create({
      title: "Task 3",
      status: "todo",
    });

    const tasks = taskService.getByStatus("todo");

    expect(tasks).toHaveLength(2);
    expect(tasks.every((task) => task.status === "todo")).toBe(true);
  });

  test("should return an empty array when no task matches the status", () => {
    taskService.create({
      title: "Task 1",
      status: "todo",
    });

    const tasks = taskService.getByStatus("done");

    expect(tasks).toEqual([]);
  });

  test("should not return tasks for a partial status", () => {
    taskService.create({
      title: "Task 1",
      status: "todo",
    });

    const tasks = taskService.getByStatus("to");

    expect(tasks).toEqual([]);
  });
});

describe("Task Service - getPaginated()", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should return the first page of tasks", () => {
    taskService.create({ title: "Task 1" });
    taskService.create({ title: "Task 2" });
    taskService.create({ title: "Task 3" });

    const tasks = taskService.getPaginated(1, 2);

    expect(tasks).toHaveLength(2);
    expect(tasks[0].title).toBe("Task 1");
    expect(tasks[1].title).toBe("Task 2");
  });

  test("should return the second page of tasks", () => {
    taskService.create({ title: "Task 1" });
    taskService.create({ title: "Task 2" });
    taskService.create({ title: "Task 3" });

    const tasks = taskService.getPaginated(2, 2);

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Task 3");
  });
});

describe("Task Service - getStats()", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should return correct task counts by status", () => {
    taskService.create({
      title: "Task 1",
      status: "todo",
    });

    taskService.create({
      title: "Task 2",
      status: "in_progress",
    });

    taskService.create({
      title: "Task 3",
      status: "done",
    });

    taskService.create({
      title: "Task 4",
      status: "todo",
    });

    const stats = taskService.getStats();

    expect(stats.todo).toBe(2);
    expect(stats.in_progress).toBe(1);
    expect(stats.done).toBe(1);
    expect(stats.overdue).toBe(0);
  });

  test("should count an unfinished task as overdue when due date has passed", () => {
    taskService.create({
      title: "Overdue Task",
      status: "todo",
      dueDate: "2020-01-01T00:00:00.000Z",
    });

    const stats = taskService.getStats();

    expect(stats.overdue).toBe(1);
  });
});

describe("Task Service - update()", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should update an existing task", () => {
    const createdTask = taskService.create({
      title: "Jest",
      status: "todo",
      priority: "medium",
    });

    const updatedTask = taskService.update(createdTask.id, {
      status: "in_progress",
      priority: "high",
    });

    expect(updatedTask).not.toBeNull();
    expect(updatedTask.id).toBe(createdTask.id);
    expect(updatedTask.title).toBe("Jest");
    expect(updatedTask.status).toBe("in_progress");
    expect(updatedTask.priority).toBe("high");
  });

  test("should return null when task does not exist", () => {
    const updatedTask = taskService.update("non-existing-id", {
      status: "done",
    });

    expect(updatedTask).toBeNull();
  });
});

describe("Task Service - remove()", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should remove an existing task", () => {
    const createdTask = taskService.create({
      title: "Task to delete",
    });

    const result = taskService.remove(createdTask.id);

    expect(result).toBe(true);
    expect(taskService.findById(createdTask.id)).toBeUndefined();
  });

  test("should return false when task does not exist", () => {
    const result = taskService.remove("non-existing-id");

    expect(result).toBe(false);
  });
});

describe("Task Service - completeTask()", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should mark an existing task as completed", () => {
    const createdTask = taskService.create({
      title: "Complete this task",
      status: "todo",
      priority: "high",
    });

    const completedTask = taskService.completeTask(createdTask.id);

    expect(completedTask).not.toBeNull();
    expect(completedTask.id).toBe(createdTask.id);
    expect(completedTask.status).toBe("done");
    expect(completedTask.priority).toBe("medium");
    expect(completedTask.completedAt).not.toBeNull();
  });

  test("should return null when task does not exist", () => {
    const completedTask = taskService.completeTask("non-existing-id");

    expect(completedTask).toBeNull();
  });
});

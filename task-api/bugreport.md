Bug Report

1. GET /tasks status filter does partial matching instead of exact matches
   File: src/services/taskService.js (getByStatus)

How I caught it: I realized that if a user passed ?status=to, it would incorrectly return tasks marked as "todo".
Expected: It should only return exact string matches for the status.
Actual: The filter was using .includes() under the hood instead of strict equality.
Fix: Swapped .includes() for === in the array filter.
Test: Added a test that checks for partial strings to ensure it returns an empty array. 

2. Pagination math is off (skips page 1)
File: src/services/taskService.js (getPaginated)

How I caught it: My basic GET /tasks?page=1&limit=2 test was failing because it wasn't returning the first items in the array.
Expected: Page 1 should return the first batch of tasks.
Actual: The offset math was page _ limit. Because API pages are 1-indexed (not 0-indexed), Page 1 was accidentally skipping the first batch entirely.
Fix: Updated the math to (page - 1) _ limit.
Test: Added tests explicitly checking the items returned on pages 1 and 2.

3. PUT allows overwriting read-only fields (id and createdAt)
File: src/services/taskService.js (update)

How I caught it: I wrote a test to pass a fake id inside a PUT request body just to see if the API would accept it.
Expected: The server should ignore attempts to change system-controlled fields.
Actual: The update method was blindly merging the request payload into the task object, completely overwriting the original ID.
Fix: Enforced the original id and createdAt values at the end of the object creation in the update method so they cannot be overwritten.
Test: Added an integration test that asserts the id and createdAt remain identical after a PUT update.

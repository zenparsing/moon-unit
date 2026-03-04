# moon-unit

Out of this world unit testing.

## Installation

```sh
npm install moon-unit
```

## Example

```javascript
import * as assert from 'assert';
import { describe, it } from 'moon-unit';

describe('Some simple tests', () => {
  it('should run a test', () => {
    assert.ok(true);
  });

  it('should show an error when a test fails', () => {
    assert.ok(false);
  });

  it('should run async tests', async () => {
    await 1;
    assert.ok(true);
  });
});
```

## API

All testing functions can be either synchronous or async (Promise-returning).

### `describe(name: string, fn: Function)`

Defines a group of tests or nested test suites.

### `it(name: string, fn: Function)`

Defines a test case.

### `before(fn: Function)`

Registers a setup function to be run once before all tests in the current `describe` block.

### `beforeEach(fn: Function)`

Registers a setup function to be run before each test in the current `describe` block.

### `after(fn: Function)`

Registers a teardown function to be run once after all tests in the current `describe` block.

### `afterEach(fn: Function)`

Registers a teardown function to be run after each test in the current `describe` block.

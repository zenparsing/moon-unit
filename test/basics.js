import * as assert from 'assert';
import { describe, it } from '../moon-unit.js';

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

  it('should show the time if the test is slow', async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    assert.ok(true);
  });
});

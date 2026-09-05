/**
 * Concurrency Test Helpers
 */

/**
 * Runs the given async function `count` times concurrently.
 * Starts them all at exactly the same time using a barrier to maximize the chance of a race condition.
 * 
 * @param {number} count Number of concurrent executions
 * @param {Function} operationFn The async function to execute. Receives the index (0 to count-1) as an argument.
 * @returns {Promise<Array>} Results of each operation (or errors if they rejected)
 */
export const runConcurrent = async (count, operationFn) => {
  const promises = [];
  
  // Create a synchronization barrier (a promise we can resolve to unblock everyone at once)
  let releaseBarrier;
  const barrier = new Promise((resolve) => {
    releaseBarrier = resolve;
  });

  for (let i = 0; i < count; i++) {
    // Each worker waits for the barrier before actually calling operationFn
    const worker = (async () => {
      await barrier;
      try {
        const res = await operationFn(i);
        return { status: 'fulfilled', value: res };
      } catch (err) {
        return { status: 'rejected', reason: err };
      }
    })();
    promises.push(worker);
  }

  // Release the barrier so they all start executing operationFn simultaneously
  releaseBarrier();

  // Wait for all to finish
  const results = await Promise.all(promises);
  
  return results;
};

/**
 * Checks how many operations were successful and how many failed.
 * 
 * @param {Array} results Array of results from runConcurrent
 * @returns {Object} { successes: number, failures: number, successfulValues: Array, failedReasons: Array }
 */
export const analyzeConcurrencyResults = (results) => {
  const successfulValues = results.filter(r => r.status === 'fulfilled').map(r => r.value);
  const failedReasons = results.filter(r => r.status === 'rejected').map(r => r.reason);
  return {
    successes: successfulValues.length,
    failures: failedReasons.length,
    successfulValues,
    failedReasons
  };
};

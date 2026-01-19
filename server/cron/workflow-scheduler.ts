/**
 * Workflow Scheduler
 *
 * Cron job that processes delayed workflow steps and scheduled workflows.
 * Runs every minute to check for due steps and scheduled workflows.
 */

import { workflowExecutor } from "../services/workflow-executor.js";

/**
 * Process delayed workflow steps
 * Should be called every minute via cron or setInterval
 */
export async function processWorkflowScheduler(): Promise<void> {
  console.log('[WorkflowScheduler] Starting scheduled workflow processing...');

  try {
    // Process delayed steps that are now due
    await workflowExecutor.processDelayedSteps();

    console.log('[WorkflowScheduler] Scheduled workflow processing completed');
  } catch (error) {
    console.error('[WorkflowScheduler] Error processing scheduled workflows:', error);
  }
}

/**
 * Start the workflow scheduler
 * Runs every minute
 */
export function startWorkflowScheduler(): NodeJS.Timeout {
  console.log('[WorkflowScheduler] Starting workflow scheduler (runs every minute)');

  // Process immediately on startup
  processWorkflowScheduler().catch(error => {
    console.error('[WorkflowScheduler] Initial run failed:', error);
  });

  // Run every minute
  const interval = setInterval(() => {
    processWorkflowScheduler().catch(error => {
      console.error('[WorkflowScheduler] Scheduled run failed:', error);
    });
  }, 60 * 1000); // Every minute

  return interval;
}

/**
 * Stop the workflow scheduler
 */
export function stopWorkflowScheduler(interval: NodeJS.Timeout): void {
  console.log('[WorkflowScheduler] Stopping workflow scheduler');
  clearInterval(interval);
}

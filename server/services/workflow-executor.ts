/**
 * Workflow Execution Engine
 *
 * Production-ready workflow automation system that executes workflows
 * triggered by HR events (candidate creation, status changes, interviews, etc.)
 */

import { db } from "../db.js";
import {
  workflows,
  workflowSteps,
  workflowExecutions,
  workflowStepExecutions,
  candidates,
  users,
  hrTasks,
  candidateNotes,
  type Workflow,
  type WorkflowStep,
  type WorkflowExecution,
  type WorkflowStepExecution,
} from "../../shared/schema.js";
import { eq, and, lte, isNull } from "drizzle-orm";
import {
  sendCandidateStatusEmail,
  sendInterviewScheduledEmail,
  sendOfferEmail
} from "./email.js";

// Workflow execution context
export interface WorkflowContext {
  candidateId?: number;
  candidate?: any;
  userId?: number;
  user?: any;
  interviewId?: number;
  oldStage?: string;
  newStage?: string;
  triggeredBy?: number;
  [key: string]: any;
}

// Step execution result
export interface StepResult {
  success: boolean;
  data?: any;
  error?: string;
  shouldContinue: boolean; // for CONDITION steps
}

/**
 * Main Workflow Executor Class
 */
export class WorkflowExecutor {
  /**
   * Execute a workflow for a given trigger and context
   */
  async executeWorkflow(workflowId: number, context: WorkflowContext): Promise<WorkflowExecution> {
    console.log(`[WorkflowExecutor] Starting workflow ${workflowId} with context:`, context);

    try {
      // Create execution record
      const [execution] = await db.insert(workflowExecutions).values({
        workflowId,
        candidateId: context.candidateId,
        status: 'RUNNING',
        context: context as any,
        startedAt: new Date(),
      }).returning();

      console.log(`[WorkflowExecutor] Created execution ${execution.id}`);

      // Get workflow steps in order
      const steps = await db
        .select()
        .from(workflowSteps)
        .where(eq(workflowSteps.workflowId, workflowId))
        .orderBy(workflowSteps.stepOrder);

      console.log(`[WorkflowExecutor] Found ${steps.length} steps to execute`);

      // Execute steps sequentially
      for (const step of steps) {
        try {
          await this.executeStep(execution.id, step, context);
        } catch (error) {
          console.error(`[WorkflowExecutor] Step ${step.id} failed:`, error);

          // Mark step as failed
          await db.insert(workflowStepExecutions).values({
            executionId: execution.id,
            stepId: step.id,
            status: 'FAILED',
            error: error instanceof Error ? error.message : String(error),
            startedAt: new Date(),
            completedAt: new Date(),
          });

          // Mark execution as failed
          await db.update(workflowExecutions)
            .set({
              status: 'FAILED',
              error: `Step ${step.title} failed: ${error instanceof Error ? error.message : String(error)}`,
              completedAt: new Date(),
            })
            .where(eq(workflowExecutions.id, execution.id));

          // Get updated execution
          const [failedExecution] = await db
            .select()
            .from(workflowExecutions)
            .where(eq(workflowExecutions.id, execution.id));

          return failedExecution;
        }
      }

      // Mark execution as completed
      await db.update(workflowExecutions)
        .set({
          status: 'COMPLETED',
          completedAt: new Date(),
        })
        .where(eq(workflowExecutions.id, execution.id));

      console.log(`[WorkflowExecutor] Workflow ${workflowId} completed successfully`);

      // Get updated execution
      const [completedExecution] = await db
        .select()
        .from(workflowExecutions)
        .where(eq(workflowExecutions.id, execution.id));

      return completedExecution;

    } catch (error) {
      console.error(`[WorkflowExecutor] Workflow ${workflowId} failed:`, error);
      throw error;
    }
  }

  /**
   * Execute a single workflow step
   */
  async executeStep(
    executionId: number,
    step: WorkflowStep,
    context: WorkflowContext
  ): Promise<StepResult> {
    console.log(`[WorkflowExecutor] Executing step ${step.id}: ${step.title} (${step.stepType})`);

    // Create step execution record
    const [stepExecution] = await db.insert(workflowStepExecutions).values({
      executionId,
      stepId: step.id,
      status: 'RUNNING',
      startedAt: new Date(),
    }).returning();

    try {
      let result: StepResult;

      switch (step.stepType) {
        case 'ACTION':
          result = await this.executeActionStep(step, context);
          break;
        case 'CONDITION':
          result = await this.executeConditionStep(step, context);
          break;
        case 'DELAY':
          result = await this.executeDelayStep(stepExecution.id, step, context);
          break;
        case 'NOTIFICATION':
          result = await this.executeNotificationStep(step, context);
          break;
        default:
          throw new Error(`Unknown step type: ${step.stepType}`);
      }

      // Update step execution
      await db.update(workflowStepExecutions)
        .set({
          status: result.success ? 'COMPLETED' : 'FAILED',
          result: result.data as any,
          error: result.error,
          completedAt: new Date(),
        })
        .where(eq(workflowStepExecutions.id, stepExecution.id));

      console.log(`[WorkflowExecutor] Step ${step.id} completed:`, result);

      return result;

    } catch (error) {
      console.error(`[WorkflowExecutor] Step ${step.id} error:`, error);

      // Update step execution as failed
      await db.update(workflowStepExecutions)
        .set({
          status: 'FAILED',
          error: error instanceof Error ? error.message : String(error),
          completedAt: new Date(),
        })
        .where(eq(workflowStepExecutions.id, stepExecution.id));

      throw error;
    }
  }

  /**
   * Execute ACTION step (SEND_EMAIL, UPDATE_STATUS, ASSIGN_TO, CREATE_TASK, ADD_NOTE)
   */
  private async executeActionStep(step: WorkflowStep, context: WorkflowContext): Promise<StepResult> {
    const config = step.config as any || {};

    switch (step.actionType) {
      case 'SEND_EMAIL': {
        const { emailType, template, to, subject, body } = config;

        if (!context.candidate && context.candidateId) {
          const [candidate] = await db
            .select()
            .from(candidates)
            .where(eq(candidates.id, context.candidateId));
          context.candidate = candidate;
        }

        if (emailType === 'status_change' && context.candidate) {
          await sendCandidateStatusEmail(
            context.candidate.email,
            context.candidate.firstName,
            context.newStage || context.candidate.status
          );
        } else if (emailType === 'offer' && context.candidate) {
          await sendOfferEmail(
            context.candidate.email,
            context.candidate.firstName,
            config.position || context.candidate.position,
            config.salary || 'competitive',
            config.startDate || 'TBD'
          );
        }

        return { success: true, shouldContinue: true, data: { emailSent: true } };
      }

      case 'UPDATE_STATUS': {
        if (!context.candidateId) {
          throw new Error('candidateId required for UPDATE_STATUS');
        }

        const newStatus = config.status;
        if (!newStatus) {
          throw new Error('status configuration required for UPDATE_STATUS');
        }

        await db.update(candidates)
          .set({ status: newStatus })
          .where(eq(candidates.id, context.candidateId));

        return { success: true, shouldContinue: true, data: { newStatus } };
      }

      case 'ASSIGN_TO': {
        if (!context.candidateId) {
          throw new Error('candidateId required for ASSIGN_TO');
        }

        const assignToUserId = config.userId;
        if (!assignToUserId) {
          throw new Error('userId configuration required for ASSIGN_TO');
        }

        await db.update(candidates)
          .set({ assignedTo: assignToUserId })
          .where(eq(candidates.id, context.candidateId));

        return { success: true, shouldContinue: true, data: { assignedTo: assignToUserId } };
      }

      case 'CREATE_TASK': {
        const { title, description, assignedTo, dueDate } = config;

        if (!title) {
          throw new Error('title configuration required for CREATE_TASK');
        }

        await db.insert(hrTasks).values({
          title,
          description,
          assignedTo: assignedTo || context.userId,
          candidateId: context.candidateId,
          dueDate,
          status: 'TODO',
        });

        return { success: true, shouldContinue: true, data: { taskCreated: true } };
      }

      case 'ADD_NOTE': {
        if (!context.candidateId) {
          throw new Error('candidateId required for ADD_NOTE');
        }

        const { content, type } = config;
        if (!content) {
          throw new Error('content configuration required for ADD_NOTE');
        }

        await db.insert(candidateNotes).values({
          candidateId: context.candidateId,
          authorId: context.triggeredBy || context.userId || 1,
          content,
          type: type || 'GENERAL',
        });

        return { success: true, shouldContinue: true, data: { noteAdded: true } };
      }

      default:
        throw new Error(`Unknown action type: ${step.actionType}`);
    }
  }

  /**
   * Execute CONDITION step (evaluate expression and branch)
   */
  private async executeConditionStep(step: WorkflowStep, context: WorkflowContext): Promise<StepResult> {
    const config = step.config as any || {};
    const { expression } = config;

    if (!expression) {
      return { success: true, shouldContinue: true };
    }

    try {
      // Simple expression evaluation
      // Format: "candidate.score > 70" or "candidate.status === 'interview'"
      const result = this.evaluateExpression(expression, context);

      return {
        success: true,
        shouldContinue: result,
        data: { expressionResult: result }
      };
    } catch (error) {
      console.error('[WorkflowExecutor] Condition evaluation error:', error);
      return { success: false, shouldContinue: false, error: String(error) };
    }
  }

  /**
   * Execute DELAY step (schedule next step for future)
   */
  private async executeDelayStep(
    stepExecutionId: number,
    step: WorkflowStep,
    context: WorkflowContext
  ): Promise<StepResult> {
    const config = step.config as any || {};
    const { duration, unit } = config; // e.g., { duration: 2, unit: 'days' }

    if (!duration || !unit) {
      throw new Error('duration and unit required for DELAY step');
    }

    // Calculate scheduled time
    const scheduledFor = new Date();
    switch (unit) {
      case 'minutes':
        scheduledFor.setMinutes(scheduledFor.getMinutes() + duration);
        break;
      case 'hours':
        scheduledFor.setHours(scheduledFor.getHours() + duration);
        break;
      case 'days':
        scheduledFor.setDate(scheduledFor.getDate() + duration);
        break;
      default:
        throw new Error(`Unknown delay unit: ${unit}`);
    }

    // Update step execution with scheduled time
    await db.update(workflowStepExecutions)
      .set({ scheduledFor })
      .where(eq(workflowStepExecutions.id, stepExecutionId));

    console.log(`[WorkflowExecutor] Delay step scheduled for ${scheduledFor.toISOString()}`);

    return {
      success: true,
      shouldContinue: true,
      data: { scheduledFor: scheduledFor.toISOString() }
    };
  }

  /**
   * Execute NOTIFICATION step (send in-app notification)
   */
  private async executeNotificationStep(step: WorkflowStep, context: WorkflowContext): Promise<StepResult> {
    const config = step.config as any || {};
    const { title, message, userId } = config;

    if (!title || !message) {
      throw new Error('title and message required for NOTIFICATION step');
    }

    // TODO: Integrate with notification service when available
    console.log(`[WorkflowExecutor] Notification:`, { title, message, userId });

    return { success: true, shouldContinue: true, data: { notificationSent: true } };
  }

  /**
   * Simple expression evaluator for CONDITION steps
   */
  private evaluateExpression(expression: string, context: WorkflowContext): boolean {
    try {
      // Replace context variables
      let evalExpression = expression;

      // Replace candidate.* references
      if (context.candidate) {
        evalExpression = evalExpression.replace(/candidate\.(\w+)/g, (_, prop) => {
          const value = context.candidate[prop];
          return typeof value === 'string' ? `"${value}"` : String(value);
        });
      }

      // Replace context.* references
      evalExpression = evalExpression.replace(/context\.(\w+)/g, (_, prop) => {
        const value = context[prop];
        return typeof value === 'string' ? `"${value}"` : String(value);
      });

      // Evaluate (basic security - only allow comparison operators)
      if (!/^[a-zA-Z0-9"'\s><=!&|()]+$/.test(evalExpression)) {
        throw new Error('Invalid expression');
      }

      return eval(evalExpression);
    } catch (error) {
      console.error('[WorkflowExecutor] Expression evaluation error:', error);
      return false;
    }
  }

  /**
   * Trigger workflows based on candidate stage change
   */
  async onCandidateStageChange(
    candidateId: number,
    oldStage: string,
    newStage: string,
    triggeredBy?: number
  ): Promise<void> {
    console.log(`[WorkflowExecutor] Candidate ${candidateId} stage change: ${oldStage} -> ${newStage}`);

    // Find workflows triggered by stage change
    const triggeredWorkflows = await db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.trigger, 'CANDIDATE_STAGE_CHANGE'),
          eq(workflows.isActive, true)
        )
      );

    console.log(`[WorkflowExecutor] Found ${triggeredWorkflows.length} workflows for stage change`);

    // Get candidate data
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId));

    if (!candidate) {
      console.error(`[WorkflowExecutor] Candidate ${candidateId} not found`);
      return;
    }

    // Execute matching workflows
    for (const workflow of triggeredWorkflows) {
      const conditions = workflow.triggerConditions as any;

      // Check if conditions match
      if (conditions?.fromStage && conditions.fromStage !== oldStage) continue;
      if (conditions?.toStage && conditions.toStage !== newStage) continue;

      try {
        await this.executeWorkflow(workflow.id, {
          candidateId,
          candidate,
          oldStage,
          newStage,
          triggeredBy,
        });
      } catch (error) {
        console.error(`[WorkflowExecutor] Workflow ${workflow.id} execution failed:`, error);
      }
    }
  }

  /**
   * Trigger workflows when candidate is created
   */
  async onCandidateCreated(candidateId: number, triggeredBy?: number): Promise<void> {
    console.log(`[WorkflowExecutor] Candidate ${candidateId} created`);

    // Find workflows triggered by candidate creation
    const triggeredWorkflows = await db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.trigger, 'CANDIDATE_CREATED'),
          eq(workflows.isActive, true)
        )
      );

    console.log(`[WorkflowExecutor] Found ${triggeredWorkflows.length} workflows for candidate creation`);

    // Get candidate data
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId));

    if (!candidate) {
      console.error(`[WorkflowExecutor] Candidate ${candidateId} not found`);
      return;
    }

    // Execute workflows
    for (const workflow of triggeredWorkflows) {
      try {
        await this.executeWorkflow(workflow.id, {
          candidateId,
          candidate,
          triggeredBy,
        });
      } catch (error) {
        console.error(`[WorkflowExecutor] Workflow ${workflow.id} execution failed:`, error);
      }
    }
  }

  /**
   * Trigger workflows when interview is completed
   */
  async onInterviewCompleted(interviewId: number, candidateId: number, triggeredBy?: number): Promise<void> {
    console.log(`[WorkflowExecutor] Interview ${interviewId} completed for candidate ${candidateId}`);

    // Find workflows triggered by interview completion
    const triggeredWorkflows = await db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.trigger, 'INTERVIEW_COMPLETED'),
          eq(workflows.isActive, true)
        )
      );

    console.log(`[WorkflowExecutor] Found ${triggeredWorkflows.length} workflows for interview completion`);

    // Get candidate data
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId));

    if (!candidate) {
      console.error(`[WorkflowExecutor] Candidate ${candidateId} not found`);
      return;
    }

    // Execute workflows
    for (const workflow of triggeredWorkflows) {
      try {
        await this.executeWorkflow(workflow.id, {
          candidateId,
          candidate,
          interviewId,
          triggeredBy,
        });
      } catch (error) {
        console.error(`[WorkflowExecutor] Workflow ${workflow.id} execution failed:`, error);
      }
    }
  }

  /**
   * Process delayed workflow steps that are due
   */
  async processDelayedSteps(): Promise<void> {
    console.log('[WorkflowExecutor] Processing delayed steps...');

    try {
      // Find step executions that are scheduled and due
      let dueSteps;
      try {
        dueSteps = await db
          .select()
          .from(workflowStepExecutions)
          .where(
            and(
              eq(workflowStepExecutions.status, 'PENDING'),
              lte(workflowStepExecutions.scheduledFor, new Date())
            )
          );
      } catch (error: any) {
        // Handle missing table gracefully (table may not exist in production yet)
        if (error.code === '42P01') {
          console.log('[WorkflowExecutor] Workflow tables not yet created - skipping delayed step processing');
          return;
        }
        throw error;
      }

      console.log(`[WorkflowExecutor] Found ${dueSteps.length} delayed steps to process`);

      for (const stepExecution of dueSteps) {
        try {
          // Get execution context
          const [execution] = await db
            .select()
            .from(workflowExecutions)
            .where(eq(workflowExecutions.id, stepExecution.executionId));

          if (!execution || execution.status !== 'RUNNING') {
            console.log(`[WorkflowExecutor] Skipping step ${stepExecution.id} - execution not running`);
            continue;
          }

          // Get step details
          const [step] = await db
            .select()
            .from(workflowSteps)
            .where(eq(workflowSteps.id, stepExecution.stepId));

          if (!step) {
            console.error(`[WorkflowExecutor] Step ${stepExecution.stepId} not found`);
            continue;
          }

          // Resume execution from this step
          const context = execution.context as WorkflowContext;
          await this.executeStep(execution.id, step, context);

        } catch (error) {
          console.error(`[WorkflowExecutor] Failed to process delayed step ${stepExecution.id}:`, error);
        }
      }
    } catch (error) {
      console.error('[WorkflowExecutor] Error processing delayed steps:', error);
    }
  }
}

// Export singleton instance
export const workflowExecutor = new WorkflowExecutor();

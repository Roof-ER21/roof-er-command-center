-- Migration: Add Workflow Execution System
-- Date: 2026-01-19
-- Description: Adds execution tables and enhances workflow tables for automation engine

-- Add trigger and conditions fields to workflows table
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS trigger TEXT NOT NULL DEFAULT 'MANUAL',
ADD COLUMN IF NOT EXISTS trigger_conditions JSONB;

-- Add step type and configuration fields to workflow_steps table
ALTER TABLE workflow_steps
ADD COLUMN IF NOT EXISTS step_type TEXT NOT NULL DEFAULT 'ACTION',
ADD COLUMN IF NOT EXISTS action_type TEXT,
ADD COLUMN IF NOT EXISTS config JSONB;

-- Create workflow_executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER NOT NULL REFERENCES workflows(id),
  candidate_id INTEGER REFERENCES candidates(id),
  status TEXT NOT NULL DEFAULT 'RUNNING',
  current_step_id INTEGER REFERENCES workflow_steps(id),
  context JSONB,
  error TEXT,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create workflow_step_executions table
CREATE TABLE IF NOT EXISTS workflow_step_executions (
  id SERIAL PRIMARY KEY,
  execution_id INTEGER NOT NULL REFERENCES workflow_executions(id),
  step_id INTEGER NOT NULL REFERENCES workflow_steps(id),
  status TEXT NOT NULL DEFAULT 'PENDING',
  result JSONB,
  error TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  scheduled_for TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_candidate_id ON workflow_executions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_execution_id ON workflow_step_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_step_id ON workflow_step_executions(step_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_scheduled_for ON workflow_step_executions(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Add comment documentation
COMMENT ON TABLE workflow_executions IS 'Tracks individual workflow execution instances';
COMMENT ON TABLE workflow_step_executions IS 'Tracks execution of individual workflow steps';
COMMENT ON COLUMN workflows.trigger IS 'Trigger type: MANUAL, CANDIDATE_CREATED, CANDIDATE_STAGE_CHANGE, INTERVIEW_COMPLETED, SCHEDULED';
COMMENT ON COLUMN workflows.trigger_conditions IS 'JSON conditions for when to trigger workflow (e.g., {"fromStage": "screening", "toStage": "interview"})';
COMMENT ON COLUMN workflow_steps.step_type IS 'Step type: ACTION, CONDITION, DELAY, NOTIFICATION';
COMMENT ON COLUMN workflow_steps.action_type IS 'Action type for ACTION steps: SEND_EMAIL, UPDATE_STATUS, ASSIGN_TO, CREATE_TASK, ADD_NOTE';
COMMENT ON COLUMN workflow_steps.config IS 'JSON configuration for step execution (varies by step type)';

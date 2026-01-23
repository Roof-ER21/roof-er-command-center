import { Router } from 'express';
import { db } from '../../db.js';
import { safetyIncidents, users } from '../../../shared/schema.js';
import { eq, desc, sql, and, gte, lte, or } from 'drizzle-orm';
import {
  sendSafetyIncidentReportedEmail,
  sendSafetyIncidentAssignedEmail,
  sendSafetyIncidentEscalatedEmail,
  sendSafetyIncidentResolvedEmail,
} from '../../services/safety-email.js';
import { requireAuth } from '../../middleware/auth.js';
import { selectUserColumns } from '../../utils/user-select.js';

const router = Router();

/**
 * GET /api/safety/incidents
 * List all safety incidents with optional filters
 */
router.get('/incidents', requireAuth, async (req, res) => {
  try {
    const {
      severity,
      status,
      category,
      startDate,
      endDate,
    } = req.query;

    let query = db
      .select({
        incident: safetyIncidents,
        reporter: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
        assignee: sql<{
          id: number;
          firstName: string;
          lastName: string;
          email: string;
        } | null>`
          CASE
            WHEN ${safetyIncidents.assignedTo} IS NOT NULL
            THEN json_build_object(
              'id', assignee.id,
              'firstName', assignee.first_name,
              'lastName', assignee.last_name,
              'email', assignee.email
            )
            ELSE NULL
          END
        `.as('assignee'),
      })
      .from(safetyIncidents)
      .leftJoin(users, eq(safetyIncidents.reportedBy, users.id))
      .leftJoin(
        sql`${users} AS assignee`,
        sql`${safetyIncidents.assignedTo} = assignee.id`
      );

    // Apply filters
    const conditions: any[] = [];
    const allowedSeverities = ['low', 'medium', 'high', 'critical'] as const;
    const allowedStatuses = ['reported', 'investigating', 'resolved', 'closed'] as const;
    const allowedCategories = ['injury', 'near_miss', 'property_damage', 'environmental', 'other'] as const;

    if (severity) {
      if (allowedSeverities.includes(severity as typeof allowedSeverities[number])) {
        conditions.push(eq(safetyIncidents.severity, severity as typeof allowedSeverities[number]));
      }
    }

    if (status) {
      if (allowedStatuses.includes(status as typeof allowedStatuses[number])) {
        conditions.push(eq(safetyIncidents.status, status as typeof allowedStatuses[number]));
      }
    }

    if (category) {
      if (allowedCategories.includes(category as typeof allowedCategories[number])) {
        conditions.push(eq(safetyIncidents.category, category as typeof allowedCategories[number]));
      }
    }

    if (startDate) {
      conditions.push(gte(safetyIncidents.incidentDate, new Date(startDate as string)));
    }

    if (endDate) {
      conditions.push(lte(safetyIncidents.incidentDate, new Date(endDate as string)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const incidents = await query.orderBy(desc(safetyIncidents.createdAt));

    res.json(incidents);
  } catch (error: any) {
    console.error('Error fetching safety incidents:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/safety/incidents
 * Report a new safety incident
 */
router.post('/incidents', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).session.userId;

    const {
      title,
      description,
      location,
      incidentDate,
      severity,
      category,
      injuryType,
      witnesses,
      actionsTaken,
      preventiveMeasures,
      assignedTo,
    } = req.body;

    // Validate required fields
    if (!title || !description || !incidentDate || !severity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, incidentDate, severity',
      });
    }

    // Create incident
    const [incident] = await db.insert(safetyIncidents).values({
      reportedBy: userId,
      assignedTo: assignedTo || null,
      title,
      description,
      location,
      incidentDate: new Date(incidentDate),
      severity,
      category,
      injuryType,
      witnesses,
      actionsTaken,
      preventiveMeasures,
      status: 'reported',
    }).returning();

    // Fetch reporter details
    const [reporter] = await db.select(selectUserColumns()).from(users).where(eq(users.id, userId));

    // Send notification emails based on severity
    if (severity === 'critical') {
      // Send to all HR admins
      const hrAdmins = await db.select()
        .from(users)
        .where(eq(users.role, 'HR_ADMIN'));

      for (const admin of hrAdmins) {
        await sendSafetyIncidentReportedEmail(incident, reporter, admin);
      }
    } else if (severity === 'high') {
      // Send to assigned person if available
      if (assignedTo) {
        const [assignee] = await db.select(selectUserColumns()).from(users).where(eq(users.id, assignedTo));
        if (assignee) {
          await sendSafetyIncidentReportedEmail(incident, reporter, assignee);
        }
      }
    }

    // If assigned, send assignment email
    if (assignedTo) {
      const [assignee] = await db.select(selectUserColumns()).from(users).where(eq(users.id, assignedTo));
      if (assignee) {
        await sendSafetyIncidentAssignedEmail(incident, assignee);
      }
    }

    res.json({
      success: true,
      incident,
    });
  } catch (error: any) {
    console.error('Error creating safety incident:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/safety/incidents/:id
 * Get incident details
 */
router.get('/incidents/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db
      .select({
        incident: safetyIncidents,
        reporter: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(safetyIncidents)
      .leftJoin(users, eq(safetyIncidents.reportedBy, users.id))
      .where(eq(safetyIncidents.id, parseInt(id)));

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found',
      });
    }

    // Fetch assignee separately if exists
    let assignee = null;
    if (result.incident.assignedTo) {
      [assignee] = await db.select(selectUserColumns()).from(users).where(eq(users.id, result.incident.assignedTo));
    }

    // Fetch resolver separately if exists
    let resolver = null;
    if (result.incident.resolvedBy) {
      [resolver] = await db.select(selectUserColumns()).from(users).where(eq(users.id, result.incident.resolvedBy));
    }

    res.json({
      ...result.incident,
      reporter: result.reporter,
      assignee,
      resolver,
    });
  } catch (error: any) {
    console.error('Error fetching incident details:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/safety/incidents/:id
 * Update incident
 */
router.patch('/incidents/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).session.userId;

    const {
      assignedTo,
      status,
      severity,
      actionsTaken,
      preventiveMeasures,
      injuryType,
      witnesses,
      location,
      category,
    } = req.body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = userId;
      }
    }
    if (severity !== undefined) updateData.severity = severity;
    if (actionsTaken !== undefined) updateData.actionsTaken = actionsTaken;
    if (preventiveMeasures !== undefined) updateData.preventiveMeasures = preventiveMeasures;
    if (injuryType !== undefined) updateData.injuryType = injuryType;
    if (witnesses !== undefined) updateData.witnesses = witnesses;
    if (location !== undefined) updateData.location = location;
    if (category !== undefined) updateData.category = category;

    const [updatedIncident] = await db
      .update(safetyIncidents)
      .set(updateData)
      .where(eq(safetyIncidents.id, parseInt(id)))
      .returning();

    if (!updatedIncident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found',
      });
    }

    // Send emails if status changed or assigned
    if (assignedTo !== undefined && assignedTo !== null) {
      const [assignee] = await db.select(selectUserColumns()).from(users).where(eq(users.id, assignedTo));
      if (assignee) {
        await sendSafetyIncidentAssignedEmail(updatedIncident, assignee);
      }
    }

    if (status === 'resolved' || status === 'closed') {
      const [resolver] = await db.select(selectUserColumns()).from(users).where(eq(users.id, userId));
      if (resolver) {
        // Notify reporter
        const [reporter] = await db.select(selectUserColumns()).from(users).where(eq(users.id, updatedIncident.reportedBy));
        if (reporter) {
          await sendSafetyIncidentResolvedEmail(updatedIncident, resolver, reporter);
        }
      }
    }

    res.json({
      success: true,
      incident: updatedIncident,
    });
  } catch (error: any) {
    console.error('Error updating incident:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/safety/incidents/:id/escalate
 * Escalate an incident
 */
router.post('/incidents/:id/escalate', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Fetch incident
    const [incident] = await db.select().from(safetyIncidents).where(eq(safetyIncidents.id, parseInt(id)));

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found',
      });
    }

    // Update escalation fields
    const [updatedIncident] = await db
      .update(safetyIncidents)
      .set({
        lastEscalatedAt: new Date(),
        escalationCount: incident.escalationCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(safetyIncidents.id, parseInt(id)))
      .returning();

    // Send escalation emails to all HR admins
    const hrAdmins = await db.select()
      .from(users)
      .where(eq(users.role, 'HR_ADMIN'));

    const escalationReason = reason || 'Incident requires immediate attention due to escalation threshold.';

    for (const admin of hrAdmins) {
      await sendSafetyIncidentEscalatedEmail(updatedIncident, escalationReason, admin);
    }

    res.json({
      success: true,
      incident: updatedIncident,
    });
  } catch (error: any) {
    console.error('Error escalating incident:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/safety/stats
 * Get safety statistics
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Base date filter
    const dateConditions: any[] = [];
    if (startDate) {
      dateConditions.push(gte(safetyIncidents.createdAt, new Date(startDate as string)));
    }
    if (endDate) {
      dateConditions.push(lte(safetyIncidents.createdAt, new Date(endDate as string)));
    }

    // Total incidents
    const [{ count: totalIncidents }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(safetyIncidents)
      .where(dateConditions.length > 0 ? and(...dateConditions) : undefined);

    // Open incidents
    const [{ count: openIncidents }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(safetyIncidents)
      .where(
        and(
          or(
            eq(safetyIncidents.status, 'reported'),
            eq(safetyIncidents.status, 'investigating')
          ),
          ...(dateConditions.length > 0 ? dateConditions : [])
        )
      );

    // Incidents by severity
    const bySeverity = await db
      .select({
        severity: safetyIncidents.severity,
        count: sql<number>`count(*)`,
      })
      .from(safetyIncidents)
      .where(dateConditions.length > 0 ? and(...dateConditions) : undefined)
      .groupBy(safetyIncidents.severity);

    // Incidents by category
    const byCategory = await db
      .select({
        category: safetyIncidents.category,
        count: sql<number>`count(*)`,
      })
      .from(safetyIncidents)
      .where(dateConditions.length > 0 ? and(...dateConditions) : undefined)
      .groupBy(safetyIncidents.category);

    // Average resolution time
    const [{ avgResolutionTime }] = await db
      .select({
        avgResolutionTime: sql<number>`
          AVG(EXTRACT(EPOCH FROM (${safetyIncidents.resolvedAt} - ${safetyIncidents.createdAt})) / 3600)
        `,
      })
      .from(safetyIncidents)
      .where(
        and(
          sql`${safetyIncidents.resolvedAt} IS NOT NULL`,
          ...(dateConditions.length > 0 ? dateConditions : [])
        )
      );

    // Incidents by month (last 6 months)
    const byMonth = await db
      .select({
        month: sql<string>`TO_CHAR(${safetyIncidents.createdAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)`,
      })
      .from(safetyIncidents)
      .where(gte(safetyIncidents.createdAt, sql`NOW() - INTERVAL '6 months'`))
      .groupBy(sql`TO_CHAR(${safetyIncidents.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${safetyIncidents.createdAt}, 'YYYY-MM')`);

    res.json({
      totalIncidents: parseInt(totalIncidents as any),
      openIncidents: parseInt(openIncidents as any),
      avgResolutionTime: avgResolutionTime ? parseFloat(avgResolutionTime as any) : null,
      bySeverity,
      byCategory,
      byMonth,
    });
  } catch (error: any) {
    console.error('Error fetching safety stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

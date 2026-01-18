#!/usr/bin/env tsx
import http from 'http';
import https from 'https';
import { db } from '../server/db.js';
import { users } from '../shared/schema.js';

interface HealthCheckResult {
  passed: boolean;
  message: string;
  details?: string;
  duration?: number;
}

class HealthChecker {
  private results: HealthCheckResult[] = [];
  private serverUrl: string;

  constructor() {
    this.serverUrl = process.env.SERVER_URL || 'http://localhost:3001';
  }

  /**
   * Check database connection
   */
  async checkDatabase(): Promise<HealthCheckResult> {
    console.log('🔍 Checking database connection...');
    const startTime = Date.now();

    try {
      // Try to execute a simple query
      const result = await db.select().from(users).limit(1);
      const duration = Date.now() - startTime;

      return {
        passed: true,
        message: 'Database connection successful',
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        passed: false,
        message: 'Database connection failed',
        details: error.message,
        duration,
      };
    }
  }

  /**
   * Check API endpoint accessibility
   */
  async checkAPIEndpoint(
    endpoint: string,
    method: string = 'GET',
    expectedStatus: number = 200
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const url = `${this.serverUrl}${endpoint}`;
      const protocol = url.startsWith('https') ? https : http;

      const options = {
        method,
        timeout: 5000,
      };

      const req = protocol.request(url, options, (res) => {
        const duration = Date.now() - startTime;

        // For auth endpoints, 401 is expected if not authenticated
        const acceptableStatuses = [expectedStatus, 401, 403];

        if (acceptableStatuses.includes(res.statusCode || 0)) {
          resolve({
            passed: true,
            message: `${endpoint} is accessible`,
            details: `Status: ${res.statusCode}`,
            duration,
          });
        } else {
          resolve({
            passed: false,
            message: `${endpoint} returned unexpected status`,
            details: `Status: ${res.statusCode}, Expected: ${expectedStatus}`,
            duration,
          });
        }
      });

      req.on('error', (error) => {
        const duration = Date.now() - startTime;
        resolve({
          passed: false,
          message: `${endpoint} is not accessible`,
          details: error.message,
          duration,
        });
      });

      req.on('timeout', () => {
        const duration = Date.now() - startTime;
        req.destroy();
        resolve({
          passed: false,
          message: `${endpoint} request timed out`,
          duration,
        });
      });

      req.end();
    });
  }

  /**
   * Check frontend build
   */
  async checkFrontendBuild(): Promise<HealthCheckResult> {
    console.log('🔍 Checking frontend build...');
    const startTime = Date.now();

    try {
      const { existsSync } = await import('fs');
      const { join } = await import('path');

      const buildPath = join(process.cwd(), 'dist', 'public');
      const indexPath = join(buildPath, 'index.html');

      if (!existsSync(buildPath)) {
        return {
          passed: false,
          message: 'Frontend build directory not found',
          details: 'Run npm run build',
          duration: Date.now() - startTime,
        };
      }

      if (!existsSync(indexPath)) {
        return {
          passed: false,
          message: 'Frontend index.html not found',
          details: 'Run npm run build',
          duration: Date.now() - startTime,
        };
      }

      return {
        passed: true,
        message: 'Frontend build exists',
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        passed: false,
        message: 'Failed to check frontend build',
        details: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Run all health checks
   */
  async runChecks(): Promise<boolean> {
    console.log('🏥 Starting health checks...\n');

    // Database check
    const dbCheck = await this.checkDatabase();
    this.results.push(dbCheck);

    // API endpoint checks
    console.log('\n🔍 Checking API endpoints...');

    const apiChecks = [
      this.checkAPIEndpoint('/api/auth/me', 'GET', 200),
      this.checkAPIEndpoint('/api/health', 'GET', 200),
    ];

    const apiResults = await Promise.all(apiChecks);
    this.results.push(...apiResults);

    // Frontend build check
    const frontendCheck = await this.checkFrontendBuild();
    this.results.push(frontendCheck);

    // Print results
    console.log('\n📊 Health Check Results:\n');

    let passedCount = 0;
    this.results.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌';
      const duration = result.duration ? `(${result.duration}ms)` : '';

      console.log(`${icon} ${result.message} ${duration}`);

      if (result.details) {
        console.log(`   ${result.details}`);
      }

      if (result.passed) {
        passedCount++;
      }
    });

    console.log(`\n📈 Summary: ${passedCount}/${this.results.length} checks passed\n`);

    const allPassed = this.results.every((r) => r.passed);

    if (allPassed) {
      console.log('✅ All health checks passed!\n');
    } else {
      console.log('❌ Some health checks failed. Please review the details above.\n');
    }

    return allPassed;
  }
}

// Run health checks
async function main() {
  const checker = new HealthChecker();

  try {
    const success = await checker.runChecks();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Health check failed with error:', error);
    process.exit(1);
  }
}

main();

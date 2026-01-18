#!/usr/bin/env tsx
import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string;
}

class BuildValidator {
  private errors: string[] = [];
  private warnings: string[] = [];
  private passed: number = 0;

  /**
   * Check if required files exist
   */
  async checkRequiredFiles(): Promise<ValidationResult> {
    console.log('\n🔍 Checking required files...');

    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'vitest.config.ts',
      'client/index.html',
      'client/src/main.tsx',
      'client/src/App.tsx',
      'server/index.ts',
      'server/db.ts',
      'shared/schema.ts',
    ];

    const missing: string[] = [];

    for (const file of requiredFiles) {
      const fullPath = join(process.cwd(), file);
      if (!existsSync(fullPath)) {
        missing.push(file);
      }
    }

    if (missing.length > 0) {
      return {
        passed: false,
        message: 'Missing required files',
        details: missing.join(', '),
      };
    }

    return {
      passed: true,
      message: 'All required files exist',
    };
  }

  /**
   * Check if required directories exist
   */
  async checkRequiredDirectories(): Promise<ValidationResult> {
    console.log('🔍 Checking required directories...');

    const requiredDirs = [
      'client',
      'client/src',
      'client/src/components',
      'client/src/hooks',
      'client/src/modules',
      'client/src/__tests__',
      'server',
      'server/routes',
      'server/middleware',
      'shared',
      'scripts',
    ];

    const missing: string[] = [];

    for (const dir of requiredDirs) {
      const fullPath = join(process.cwd(), dir);
      if (!existsSync(fullPath) || !statSync(fullPath).isDirectory()) {
        missing.push(dir);
      }
    }

    if (missing.length > 0) {
      return {
        passed: false,
        message: 'Missing required directories',
        details: missing.join(', '),
      };
    }

    return {
      passed: true,
      message: 'All required directories exist',
    };
  }

  /**
   * Validate TypeScript compilation
   */
  async checkTypeScriptCompilation(): Promise<ValidationResult> {
    console.log('🔍 Checking TypeScript compilation...');

    try {
      const { stdout, stderr } = await execAsync('npx tsc --noEmit', {
        cwd: process.cwd(),
      });

      if (stderr && stderr.includes('error TS')) {
        return {
          passed: false,
          message: 'TypeScript compilation errors found',
          details: stderr,
        };
      }

      return {
        passed: true,
        message: 'TypeScript compilation successful',
      };
    } catch (error: any) {
      return {
        passed: false,
        message: 'TypeScript compilation failed',
        details: error.message || String(error),
      };
    }
  }

  /**
   * Check for missing dependencies
   */
  async checkDependencies(): Promise<ValidationResult> {
    console.log('🔍 Checking dependencies...');

    try {
      const packageJsonPath = join(process.cwd(), 'package.json');
      if (!existsSync(packageJsonPath)) {
        return {
          passed: false,
          message: 'package.json not found',
        };
      }

      const packageJson = require(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const requiredDeps = [
        'react',
        'react-dom',
        'express',
        'drizzle-orm',
        '@tanstack/react-query',
        'zustand',
        'vite',
        'typescript',
        'vitest',
      ];

      const missing: string[] = [];

      for (const dep of requiredDeps) {
        if (!allDeps[dep]) {
          missing.push(dep);
        }
      }

      if (missing.length > 0) {
        return {
          passed: false,
          message: 'Missing required dependencies',
          details: missing.join(', '),
        };
      }

      // Check if node_modules exists
      const nodeModulesPath = join(process.cwd(), 'node_modules');
      if (!existsSync(nodeModulesPath)) {
        return {
          passed: false,
          message: 'node_modules not found',
          details: 'Run npm install',
        };
      }

      return {
        passed: true,
        message: 'All required dependencies are installed',
      };
    } catch (error: any) {
      return {
        passed: false,
        message: 'Failed to check dependencies',
        details: error.message,
      };
    }
  }

  /**
   * Validate route files exist
   */
  async checkRoutes(): Promise<ValidationResult> {
    console.log('🔍 Checking route files...');

    const routeFiles = [
      'server/routes/auth/index.ts',
      'server/routes/hr/index.ts',
      'server/routes/leaderboard/index.ts',
      'server/routes/training/index.ts',
      'server/routes/field/index.ts',
    ];

    const missing: string[] = [];

    for (const route of routeFiles) {
      const fullPath = join(process.cwd(), route);
      if (!existsSync(fullPath)) {
        missing.push(route);
      }
    }

    if (missing.length > 0) {
      return {
        passed: false,
        message: 'Missing route files',
        details: missing.join(', '),
      };
    }

    return {
      passed: true,
      message: 'All route files exist',
    };
  }

  /**
   * Check environment configuration
   */
  async checkEnvironment(): Promise<ValidationResult> {
    console.log('🔍 Checking environment configuration...');

    const warnings: string[] = [];

    // Check for .env file
    if (!existsSync(join(process.cwd(), '.env'))) {
      warnings.push('No .env file found');
    }

    // Check for .env.example
    if (!existsSync(join(process.cwd(), '.env.example'))) {
      warnings.push('No .env.example file found');
    }

    if (warnings.length > 0) {
      return {
        passed: true,
        message: 'Environment check completed with warnings',
        details: warnings.join(', '),
      };
    }

    return {
      passed: true,
      message: 'Environment configuration looks good',
    };
  }

  /**
   * Check test files
   */
  async checkTests(): Promise<ValidationResult> {
    console.log('🔍 Checking test files...');

    const testFiles = [
      'client/src/__tests__/setup.ts',
      'client/src/__tests__/auth.test.ts',
      'client/src/__tests__/api.test.ts',
    ];

    const missing: string[] = [];

    for (const test of testFiles) {
      const fullPath = join(process.cwd(), test);
      if (!existsSync(fullPath)) {
        missing.push(test);
      }
    }

    if (missing.length > 0) {
      return {
        passed: false,
        message: 'Missing test files',
        details: missing.join(', '),
      };
    }

    return {
      passed: true,
      message: 'All test files exist',
    };
  }

  /**
   * Run all validations
   */
  async validate(): Promise<boolean> {
    console.log('🚀 Starting build validation...\n');

    const checks = [
      this.checkRequiredFiles(),
      this.checkRequiredDirectories(),
      this.checkDependencies(),
      this.checkRoutes(),
      this.checkTests(),
      this.checkEnvironment(),
      this.checkTypeScriptCompilation(),
    ];

    const results = await Promise.all(checks);

    console.log('\n📊 Validation Results:\n');

    results.forEach((result) => {
      if (result.passed) {
        console.log(`✅ ${result.message}`);
        this.passed++;
      } else {
        console.log(`❌ ${result.message}`);
        this.errors.push(result.message);
        if (result.details) {
          console.log(`   Details: ${result.details}`);
        }
      }
    });

    console.log(`\n📈 Summary: ${this.passed}/${results.length} checks passed\n`);

    if (this.errors.length > 0) {
      console.log('❌ Validation failed with errors:\n');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      return false;
    }

    console.log('✅ All validations passed!\n');
    return true;
  }
}

// Run validation
const validator = new BuildValidator();
validator.validate().then((success) => {
  process.exit(success ? 0 : 1);
});

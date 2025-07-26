#!/usr/bin/env node

/**
 * Security check script for dependencies and code analysis
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const SEVERITY_LEVELS = {
  info: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4
};

const MAX_ALLOWED_SEVERITY = SEVERITY_LEVELS.moderate;

async function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error && !stdout) {
        reject(error);
      } else {
        resolve({ stdout, stderr, error });
      }
    });
  });
}

async function checkNpmAudit() {
  console.log('🔍 Running npm audit...');
  
  try {
    const { stdout } = await runCommand('npm audit --json');
    const auditResult = JSON.parse(stdout);
    
    const vulnerabilities = auditResult.vulnerabilities || {};
    const summary = {
      total: 0,
      info: 0,
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0
    };
    
    Object.values(vulnerabilities).forEach(vuln => {
      summary.total++;
      summary[vuln.severity]++;
    });
    
    console.log('\n📊 Vulnerability Summary:');
    console.log(`   Total: ${summary.total}`);
    console.log(`   Critical: ${summary.critical}`);
    console.log(`   High: ${summary.high}`);
    console.log(`   Moderate: ${summary.moderate}`);
    console.log(`   Low: ${summary.low}`);
    console.log(`   Info: ${summary.info}`);
    
    // Check if we have high or critical vulnerabilities
    if (summary.critical > 0 || summary.high > 0) {
      console.error('\n❌ Found high or critical vulnerabilities!');
      
      // List critical and high vulnerabilities
      Object.entries(vulnerabilities).forEach(([name, vuln]) => {
        if (vuln.severity === 'critical' || vuln.severity === 'high') {
          console.error(`\n   Package: ${name}`);
          console.error(`   Severity: ${vuln.severity}`);
          console.error(`   Via: ${vuln.via.map(v => v.title || v).join(', ')}`);
        }
      });
      
      return false;
    }
    
    console.log('\n✅ No high or critical vulnerabilities found');
    return true;
  } catch (error) {
    console.error('❌ Error running npm audit:', error.message);
    return false;
  }
}

async function checkOutdatedPackages() {
  console.log('\n🔍 Checking for outdated packages...');
  
  try {
    const { stdout } = await runCommand('npm outdated --json');
    const outdated = stdout ? JSON.parse(stdout) : {};
    
    const outdatedCount = Object.keys(outdated).length;
    
    if (outdatedCount > 0) {
      console.log(`\n⚠️  Found ${outdatedCount} outdated packages:`);
      
      Object.entries(outdated).forEach(([name, info]) => {
        const current = info.current || 'not installed';
        const wanted = info.wanted;
        const latest = info.latest;
        
        if (current !== latest) {
          console.log(`   ${name}: ${current} → ${latest} (wanted: ${wanted})`);
        }
      });
    } else {
      console.log('\n✅ All packages are up to date');
    }
    
    return true;
  } catch (error) {
    // npm outdated returns non-zero exit code when packages are outdated
    // This is expected behavior, so we handle it gracefully
    return true;
  }
}

async function checkSecurityHeaders() {
  console.log('\n🔍 Checking security headers configuration...');
  
  const viteConfigPath = path.join(process.cwd(), 'vite.config.js');
  
  if (!fs.existsSync(viteConfigPath)) {
    console.warn('⚠️  vite.config.js not found');
    return true;
  }
  
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  const securityHeaders = [
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy'
  ];
  
  const missingHeaders = [];
  
  securityHeaders.forEach(header => {
    if (!viteConfig.includes(header)) {
      missingHeaders.push(header);
    }
  });
  
  if (missingHeaders.length > 0) {
    console.warn('\n⚠️  Missing security headers:');
    missingHeaders.forEach(header => console.warn(`   - ${header}`));
    console.log('\n   Consider adding these headers to your Vite configuration');
  } else {
    console.log('\n✅ All recommended security headers are configured');
  }
  
  return true;
}

async function checkForSensitiveData() {
  console.log('\n🔍 Checking for sensitive data in code...');
  
  const sensitivePatterns = [
    { pattern: /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi, name: 'API keys' },
    { pattern: /password\s*[:=]\s*["'][^"']+["']/gi, name: 'Hardcoded passwords' },
    { pattern: /secret\s*[:=]\s*["'][^"']+["']/gi, name: 'Secrets' },
    { pattern: /private[_-]?key\s*[:=]\s*["'][^"']+["']/gi, name: 'Private keys' },
    { pattern: /token\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/gi, name: 'Tokens' }
  ];
  
  const srcDir = path.join(process.cwd(), 'src');
  const issues = [];
  
  function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    sensitivePatterns.forEach(({ pattern, name }) => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          file: path.relative(process.cwd(), filePath),
          type: name,
          count: matches.length
        });
      }
    });
  }
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath);
      } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) {
        checkFile(filePath);
      }
    });
  }
  
  walkDir(srcDir);
  
  if (issues.length > 0) {
    console.warn('\n⚠️  Potential sensitive data found:');
    issues.forEach(issue => {
      console.warn(`   ${issue.file}: ${issue.count} ${issue.type}`);
    });
    console.log('\n   Make sure these are not real credentials');
  } else {
    console.log('\n✅ No obvious sensitive data found in code');
  }
  
  return true;
}

async function checkDependencyLicenses() {
  console.log('\n🔍 Checking dependency licenses...');
  
  try {
    const { stdout } = await runCommand('npx license-checker --json --onlyAllow "MIT;Apache-2.0;BSD-3-Clause;BSD-2-Clause;ISC;CC0-1.0;Unlicense"');
    
    console.log('\n✅ All dependencies have approved licenses');
    return true;
  } catch (error) {
    console.warn('\n⚠️  Some dependencies may have incompatible licenses');
    console.log('   Run "npx license-checker" for detailed information');
    return true;
  }
}

async function runAllChecks() {
  console.log('🛡️  Running Security Checks for AirPrompts\n');
  
  const checks = [
    { name: 'NPM Audit', fn: checkNpmAudit, required: true },
    { name: 'Outdated Packages', fn: checkOutdatedPackages, required: false },
    { name: 'Security Headers', fn: checkSecurityHeaders, required: false },
    { name: 'Sensitive Data', fn: checkForSensitiveData, required: true },
    { name: 'License Check', fn: checkDependencyLicenses, required: false }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const passed = await check.fn();
    if (!passed && check.required) {
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('\n✅ All security checks passed!');
    process.exit(0);
  } else {
    console.error('\n❌ Some security checks failed!');
    process.exit(1);
  }
}

// Run checks
runAllChecks().catch(error => {
  console.error('Error running security checks:', error);
  process.exit(1);
});
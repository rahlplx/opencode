// Mutation Testing Configuration
// Run with: bun run test:mutation

export const mutationConfig = {
  // Mutation types to apply
  mutations: [
    "operator-replacement",    // Change == to !=, + to -, etc.
    "condition-boundary",      // Change < to <=, > to >=
    "return-value",            // Change return values
    "string-literal",          // Change string literals
    "number-literal",          // Change numeric literals
    "boolean-literal",         // Change true/false
    "regex-literal",           // Change regex patterns
    "function-call",           // Remove function calls
  ],
  
  // Coverage thresholds
  thresholds: {
    mutationScore: 80,        // Minimum % of mutants killed
    lineCoverage: 90,         // Minimum line coverage %
    branchCoverage: 85,       // Minimum branch coverage %
  },
  
  // Files to mutate (new code only)
  targets: [
    "packages/opencode/src/parser/**/*.ts",
    "packages/app/src/components/live-preview/**/*.tsx",
    "packages/ui/src/components/mermaid-renderer.tsx",
  ],
  
  // Files to exclude
  exclude: [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/node_modules/**",
    "**/dist/**",
  ],
  
  // Performance baselines
  performance: {
    editorFps: 60,            // Minimum editor FPS
    canvasFps: 30,            // Minimum canvas FPS
    renderTimeMs: 100,        // Maximum render time for simple diagrams
  },
}

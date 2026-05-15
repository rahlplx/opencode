// Mutation Testing Script
// This script applies mutations to the streaming parser and runs tests
// to verify test strength

import { spawn } from "child_process"
import { writeFileSync, readFileSync, unlinkSync } from "fs"
import { join } from "path"

const parserPath = join(process.cwd(), "src/parser/streaming-markdown-parser.ts")
const testPath = join(process.cwd(), "src/parser/streaming-markdown-parser.test.ts")

// Mutations to apply
const mutations = [
  {
    name: "change-fence-detection",
    description: "Change === to !== in fence detection",
    apply: (content: string) => content.replace(/buffer\[i\] === "`"/g, 'buffer[i] !== "`"'),
  },
  {
    name: "change-fence-length-comparison",
    description: "Change fence length comparison",
    apply: (content: string) => content.replace(/fenceLen === this.state.fenceLength/g, "fenceLen !== this.state.fenceLength"),
  },
  {
    name: "remove-content-extraction",
    description: "Remove content extraction logic",
    apply: (content: string) => content.replace(/this.state.currentBlock.content = buffer.substring\(contentStart, i\)/g, "this.state.currentBlock.content = ''"),
  },
  {
    name: "change-block-type-resolution",
    description: "Change block type resolution to always return UNKNOWN",
    apply: (content: string) => content.replace(/return BlockType.MERMAID/g, "return BlockType.UNKNOWN")
      .replace(/return BlockType.ECHARTS/g, "return BlockType.UNKNOWN")
      .replace(/return BlockType.REACT/g, "return BlockType.UNKNOWN")
      .replace(/return BlockType.HTML/g, "return BlockType.UNKNOWN"),
  },
  {
    name: "change-streaming-content-update",
    description: "Change streaming content update to empty string",
    apply: (content: string) => content.replace(/this.state.currentBlock.content = buffer.substring\(contentStart\)/g, "this.state.currentBlock.content = ''"),
  },
]

async function runMutationTest(mutation: typeof mutations[0]): Promise<boolean> {
  console.log(`\n🧬 Applying mutation: ${mutation.name} - ${mutation.description}`)
  
  // Read original content
  const originalContent = readFileSync(parserPath, "utf-8")
  
  // Apply mutation
  const mutatedContent = mutation.apply(originalContent)
  writeFileSync(parserPath, mutatedContent)
  
  // Run tests
  return new Promise((resolve) => {
    const testProcess = spawn("bun", ["test", "src/parser/streaming-markdown-parser.test.ts"], {
      cwd: join(process.cwd(), "packages/opencode"),
      stdio: "pipe",
    })
    
    let output = ""
    testProcess.stdout.on("data", (data) => {
      output += data.toString()
    })
    testProcess.stderr.on("data", (data) => {
      output += data.toString()
    })
    
    testProcess.on("close", (code) => {
      // Restore original content
      writeFileSync(parserPath, originalContent)
      
      const testsPassed = code === 0
      const killed = !testsPassed
      
      console.log(`   Tests ${testsPassed ? "PASSED" : "FAILED"} - Mutation ${killed ? "KILLED" : "SURVIVED"}`)
      resolve(killed)
    })
  })
}

async function main() {
  console.log("🔬 Starting mutation testing for StreamingMarkdownParser")
  console.log("=" .repeat(60))
  
  let killedCount = 0
  let survivedCount = 0
  
  for (const mutation of mutations) {
    const killed = await runMutationTest(mutation)
    if (killed) {
      killedCount++
    } else {
      survivedCount++
    }
  }
  
  console.log("\n" + "=" .repeat(60))
  console.log("📊 Mutation Testing Results")
  console.log(`   Total mutations: ${mutations.length}`)
  console.log(`   Killed: ${killedCount}`)
  console.log(`   Survived: ${survivedCount}`)
  console.log(`   Mutation score: ${((killedCount / mutations.length) * 100).toFixed(1)}%`)
  
  if (killedCount / mutations.length >= 0.8) {
    console.log("✅ Mutation score >= 80% - Tests are strong!")
  } else {
    console.log("❌ Mutation score < 80% - Need stronger tests!")
  }
}

main().catch(console.error)

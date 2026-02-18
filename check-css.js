const fs = require('fs');

// 读取 CSS 文件
const cssContent = fs.readFileSync('styles.css', 'utf-8');
const lines = cssContent.split('\n');

// 简单的大括号平衡检查
let braceStack = [];
let errors = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  // 跳过注释和字符串
  let cleanLine = line.replace(/\/\*[^\*]*\*\//g, '');
  cleanLine = cleanLine.replace(/\/\/.*$/g, '');
  cleanLine = cleanLine.replace(/"[^"]*"/g, '""');
  cleanLine = cleanLine.replace(/'[^']*'/g, "''");
  
  // 检查大括号
  for (let j = 0; j < cleanLine.length; j++) {
    if (cleanLine[j] === '{') {
      braceStack.push({ line: lineNum, col: j + 1 });
    } else if (cleanLine[j] === '}') {
      if (braceStack.length === 0) {
        errors.push(`行 ${lineNum}:${j + 1} - 多余的闭合大括号 '}'`);
      } else {
        braceStack.pop();
      }
    }
  }
  
  // 特别检查第 2380-2410  行
  if (lineNum >= 2380 && lineNum <= 2410) {
    // 检查是否有未闭合的字符串
    const singleQuotes = (line.match(/'/g) || []).length;
    const doubleQuotes = (line.match(/"/g) || []).length;
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
      console.log(`⚠️ 行 ${lineNum}: 可能有未闭合的引号`);
      console.log(`   ${line}`);
    }
  }
}

// 检查未闭合的大括号
if (braceStack.length > 0) {
  console.log('\n❌ 发现未闭合的大括号:');
  braceStack.forEach(brace => {
    console.log(`   行 ${brace.line}:${brace.col}`);
    console.log(`   ${lines[brace.line - 1]}`);
  });
}

// 打印所有错误
if (errors.length > 0) {
  console.log('\n❌ 发现错误:');
  errors.forEach(err => console.log(`   ${err}`));
}

// 检查 .modal-overlay 是否存在
const modalOverlayLine = lines.findIndex(line => line.includes('.modal-overlay {'));
if (modalOverlayLine !== -1) {
  console.log(`\n✅ 找到 .modal-overlay 在第 ${modalOverlayLine + 1} 行`);
  console.log(`   前100行的大括号栈深度: ${braceStack.length}`);
} else {
  console.log('\n❌ 未找到 .modal-overlay');
}

console.log(`\n总结:`);
console.log(`  总行数: ${lines.length}`);
console.log(`  未闭合的大括号: ${braceStack.length}`);
console.log(`  语法错误: ${errors.length}`);

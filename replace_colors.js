const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/seekers/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = {
  '#0d0d0b': '#FAF9F6',
  '#141412': 'white',
  '#1a1a17': '#F2EFE9',
  '#e8e4d8': '#2D2926',
  '#8a8780': '#78716A',
  '#8a6f3e': '#C48C5E',
  '#4a4845': '#A19D98',
  '#c9a86c': '#C48C5E',
  'rgba(255,255,255,0.07)': 'rgba(45,41,38,0.1)',
  'rgba(201,168,108,0.15)': 'rgba(196,140,94,0.2)',
  'rgba(201,168,108,0.06)': 'rgba(196,140,94,0.1)',
  'rgba(201,168,108,0.03)': 'rgba(196,140,94,0.05)',
  'rgba(201,168,108,0.9)': 'rgba(250,249,246,0.9)',
  'linear-gradient(135deg, #1a1810 0%, #0d0d0b 100%)': 'linear-gradient(135deg, #F2EFE9 0%, #FAF9F6 100%)',
  'bg-[#111109]': 'bg-[#F2EFE9]',
  'bg-[#110d0d]': 'bg-[#F2EFE9]',
  'bg-[#0d1010]': 'bg-[#F2EFE9]',
  'text-[#0d0d0b]': 'text-[#FAF9F6]',
  'fill-[#0d0d0b]': 'fill-[#C48C5E]' // For the play icon
};

for (const [oldStr, newStr] of Object.entries(replacements)) {
  content = content.split(oldStr).join(newStr);
}

// Special fixes
// In the play icon inside circular button:
content = content.replace(/fill-\[#C48C5E\] text-\[#FAF9F6\]/, 'fill-[#C48C5E] text-[#C48C5E]');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Colors replaced successfully');

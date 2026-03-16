const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/seekers/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Q&A fullAnswer section container
content = content.replace(
  /<div className="text-\[0\.95rem\] md:text-\[1rem\] leading-\[1\.85\] text-\[#78716A\]">/g,
  '<div className="text-[1.05rem] md:text-[1.1rem] font-medium leading-[1.85] text-[#4a4845]">'
);

// General text color contrast for Q&A elements (question titles)
content = content.replace(
  /font-bold text-\[1\.1rem\] md:text-\[1\.2rem\] leading-\[1\.3\]/g,
  'font-bold text-[1.2rem] md:text-[1.3rem] leading-[1.3]'
);

// Decrease size of english subtitle specifically to keep hierarchy
content = content.replace(
  /text-\[0\.85rem\] md:text-\[0\.9rem\] tracking-\[0\.05em\] text-\[#A19D98\] mt-1\.5 font-sans/g,
  'text-[0.9rem] md:text-[0.95rem] tracking-[0.05em] text-[#78716A] font-medium mt-1.5 font-sans'
);

// 2. Buttons background and contrast
content = content.replace(
  /'bg-white border border-\[#2D2926\]\/10 text-\[#78716A\] hover:bg-\[#2D2926\]\/5 hover:text-\[#2D2926\]'/g,
  "'bg-white border-[1.5px] border-[#2D2926]/20 text-[#4a4845] hover:bg-[#F2EFE9] hover:border-[#2D2926]/40 hover:text-[#2D2926] font-semibold'"
);

content = content.replace(
  /className={`px-4 md:px-5 py-2 md:py-2\.5 rounded-full text-\[0\.85rem\] md:text-\[0\.95rem\] font-medium transition-all duration-300 cursor-pointer shadow-sm/g,
  "className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[0.95rem] md:text-[1.05rem] font-bold transition-all duration-300 cursor-pointer shadow-sm"
);

// CTA Buttons
content = content.replace(
  /className="px-8 py-3 bg-\[#C48C5E\] text-\[#FAF9F6\] rounded-full font-sans text-\[0\.9rem\] md:text-\[0\.95rem\] tracking-\[0\.08em\] uppercase transition-opacity hover:opacity-85"/g,
  'className="px-8 py-3 bg-[#B87A4B] text-white rounded-full font-sans text-[0.95rem] md:text-[1.05rem] font-bold tracking-[0.08em] uppercase transition-all shadow hover:shadow-md hover:bg-[#a66a3d]"'
);

content = content.replace(
  /className="px-8 py-3 bg-transparent text-\[#78716A\] border border-\[rgba\(45,41,38,0\.1\)\] rounded-full font-sans text-\[0\.9rem\] md:text-\[0\.95rem\] tracking-\[0\.08em\] uppercase transition-all hover:border-\[#C48C5E\] hover:text-\[#2D2926\]"/g,
  'className="px-8 py-3 bg-transparent text-[#4a4845] border-[1.5px] border-[#2D2926]/20 rounded-full font-sans text-[0.95rem] md:text-[1.05rem] font-bold tracking-[0.08em] uppercase transition-all hover:border-[#2D2926]/60 hover:text-[#2D2926] hover:bg-black/5"'
);

// 3. Toggle answers quotes (shortAnswer) to handwriting font
content = content.replace(
  /<div className="font-serif text-\[1\.15rem\] italic text-\[#C48C5E\] leading-\[1\.5\] py-5 px-6 border-l-2 border-\[#C48C5E\] bg-\[rgba\(196,140,94,0\.05\)\] rounded-r-sm mb-6">/g,
  '<div className="font-handwriting text-[1.4rem] md:text-[1.6rem] text-[#2D2926] leading-[1.6] py-5 px-6 border-l-2 border-[#C48C5E] bg-[rgba(196,140,94,0.05)] rounded-r-sm mb-6">'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update script executed successfully.');

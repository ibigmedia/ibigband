const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/seekers/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Padding and Margin Adjustments (Reduce scrolling)
content = content.replace('pt-[14rem] px-10 pb-[8rem] max-w-[900px]', 'pt-[9rem] md:pt-[11rem] px-5 md:px-10 pb-[3rem] md:pb-[5rem] max-w-[900px]');
content = content.replace('px-10 pt-12 pb-[6rem]', 'px-5 md:px-10 pt-6 pb-[3rem] md:pb-[4rem]'); 
content = content.replace('px-10 pb-12', 'px-5 md:px-10 pb-6 md:pb-8'); 
content = content.replace('px-10 pb-[4rem]', 'px-5 md:px-10 pb-[2rem] md:pb-[3rem]'); 
content = content.replace('max-w-[1100px] mx-auto px-10 pb-[8rem]', 'max-w-[1100px] mx-auto px-5 md:px-10 pb-[4rem] md:pb-[6rem]'); 
content = content.replace('py-[7rem] px-10', 'py-[4rem] md:py-[6rem] px-5 md:px-10');

// 2. Font Size Adjustments
content = content.replace(/text-\[0\.72rem\]/g, 'text-[0.8rem] md:text-[0.85rem]');
content = content.replace(/text-\[0\.75rem\]/g, 'text-[0.82rem] md:text-[0.85rem]');
content = content.replace(/text-\[0\.78rem\]/g, 'text-[0.85rem] md:text-[0.9rem]');
content = content.replace(/text-\[0\.82rem\]/g, 'text-[0.9rem] md:text-[0.95rem]');
content = content.replace(/text-\[0\.84rem\]/g, 'text-[0.9rem] md:text-[0.95rem]');
content = content.replace(/text-\[0\.92rem\]/g, 'text-[0.95rem] md:text-[1rem]');

// Huge fonts shrinking slightly
content = content.replace('text-[clamp(3.2rem,8vw,6.5rem)]', 'text-[clamp(2.5rem,7vw,5rem)]');

// 3. Opening Quote and CTA to Handwriting
content = content.replace(
  'font-serif text-[clamp(1.4rem,3.5vw,2rem)] font-light italic leading-[1.5] text-[#2D2926]', 
  'font-handwriting text-[clamp(1.6rem,4vw,2.5rem)] leading-[1.4] text-[#2D2926]'
);
content = content.replace(
  'font-serif text-[clamp(2rem,5vw,3.2rem)] font-light leading-[1.2] mb-6 text-[#2D2926]', 
  'font-handwriting text-[clamp(2.4rem,6vw,3.5rem)] leading-[1.2] mb-5 text-[#2D2926]'
);

// Quote decoration fixes
content = content.replace('absolute top-10 -left-6 text-[8rem]', 'absolute top-6 md:top-10 -left-2 md:-left-6 text-[6rem] md:text-[8rem]');
content = content.replace('mt-6 text-[0.78rem]', 'mt-4 md:mt-6 text-[0.85rem] font-sans');

// 4. M3 Filter Buttons
content = content.replace(
  /className=\{`px-\[1\.1rem\].*?\`\}/s,
  `className={\`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[0.85rem] md:text-[0.95rem] font-medium transition-all duration-300 cursor-pointer shadow-sm
                \${activeFilter === cat.id 
                  ? 'bg-[#2D2926] text-white border-transparent transform -translate-y-[1px] shadow-md' 
                  : 'bg-white border border-[#2D2926]/10 text-[#78716A] hover:bg-[#2D2926]/5 hover:text-[#2D2926]'
                }\`}`
);

// 5. M3 Q&A Accordion & Search
content = content.replace(
  'className="w-full bg-[white] border border-[rgba(45,41,38,0.1)] rounded px-6 py-4 text-[#2D2926] font-sans text-[0.9rem] font-light outline-none transition-colors duration-200 focus:border-[#C48C5E] placeholder:text-[#A19D98]"',
  'className="w-full bg-white shadow-sm border border-[#2D2926]/10 rounded-[20px] md:rounded-full px-6 py-4 md:py-4 text-[#2D2926] font-sans text-[0.95rem] md:text-[1rem] outline-none transition-all duration-300 focus:border-[#C48C5E] focus:shadow-md placeholder:text-[#A19D98]"'
);

content = content.replace(
  'className="border-b border-[rgba(45,41,38,0.1)] overflow-hidden group/item"',
  'className="mb-3 md:mb-4 bg-white rounded-2xl md:rounded-[24px] border border-[#2D2926]/10 overflow-hidden group/item shadow-sm hover:shadow-md transition-all duration-300"'
);

content = content.replace(
  'className="w-full py-[1.6rem] flex items-center justify-between text-left font-sans transition-colors duration-200 outline-none"',
  'className="w-full px-5 py-4 md:px-6 md:py-5 flex items-center justify-between text-left font-sans transition-colors duration-200 outline-none hover:bg-slate-50/50"'
);

content = content.replace(
  'className={`font-serif text-[clamp(1.1rem,2.5vw,1.4rem)] font-normal leading-[1.3] transition-colors duration-300 ${isOpen ? \'text-[#2D2926]\' : \'text-[#78716A] group-hover/item:text-[#2D2926]\'}`}',
  'className={`font-bold text-[1.1rem] md:text-[1.2rem] leading-[1.3] transition-colors duration-300 ${isOpen ? \'text-[#C48C5E]\' : \'text-[#2D2926] group-hover/item:text-[#C48C5E]\'}`}'
);

content = content.replace(
  'className={`w-7 h-7 border rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? \'border-[#C48C5E]\' : \'border-[rgba(45,41,38,0.1)]\'}`}',
  'className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? \'bg-[#C48C5E]/10 text-[#C48C5E]\' : \'bg-[#2D2926]/5 text-[#78716A]\'}`}'
);

content = content.replace(
  'stroke={isOpen ? \'#C48C5E\' : \'#78716A\'}',
  'stroke="currentColor"'
);

content = content.replace(
  'className="pb-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-start mt-4"',
  'className="px-5 md:px-6 pb-6 md:pb-8 pt-2 md:pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start"'
);

// 6. Bottom Buttons to match landing page
content = content.replace(
  '<a href="#" className="px-8 py-3 bg-[#C48C5E] text-[#FAF9F6] rounded-sm font-sans text-[0.82rem] tracking-[0.08em] uppercase transition-opacity hover:opacity-85">',
  '<a href="#" className="inline-flex w-full sm:w-auto justify-center items-center px-8 py-4 md:py-4 bg-[#2D2926]/90 text-white rounded-full md:rounded-ibig hover:bg-[#2D2926] hover:shadow-lg hover:-translate-y-1 transition-all font-medium text-[14px] md:text-base cursor-pointer">'
);
content = content.replace(
  '<Link href="/music" className="px-8 py-3 bg-transparent text-[#78716A] border border-[rgba(45,41,38,0.1)] rounded-sm font-sans text-[0.82rem] tracking-[0.08em] uppercase transition-all hover:border-[#C48C5E] hover:text-[#2D2926]">',
  '<Link href="/music" className="inline-flex w-full sm:w-auto justify-center items-center bg-transparent border border-[#2D2926]/15 text-[#2D2926] px-8 py-4 md:py-4 rounded-full md:rounded-ibig hover:bg-[#2D2926]/5 transition-all font-medium text-[14px] md:text-base cursor-pointer">'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update script executed successfully.');

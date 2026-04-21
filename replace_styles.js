const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') && (file.includes('SubForm') || file.includes('Tab'))) { 
      results.push(file);
    }
  });
  return results;
}
const files = walk('./src/components/forms/change-of-status');
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  
  // 1. Replace section containers
  c = c.replace(/<section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-[^"]*"/g, '<div className="subsection"');
  c = c.replace(/<section className="bg-white[^"]*"/g, '<div className="subsection"');
  c = c.replace(/<\/section>/g, '</div>');
  
  // 2. Replace headers and descriptions
  c = c.replace(/<div className="flex flex-col md:flex-row md:items-center justify-between border-b[^"]*"/g, '<div className="subsection-header-row"');
  c = c.replace(/<div className="flex items-center justify-between border-b[^"]*"/g, '<div className="subsection-header-row"');
  
  // 3. Replace <h4 ...> -> <h3 className='subsection-title'>
  c = c.replace(/<h4 className="text-md font-semibold text-slate-800[^"]*">([^<]*)<\/h4>/g, '<h3 className="subsection-title">$1</h3>');
  
  // 4. Replace paragraph desc
  c = c.replace(/<p className="text-xs text-slate-500 mt-1">/g, '<p className="subsection-desc">');
  
  // 5. Replace <h5 ...> -> depending on context. For most it's a section divider within subsection
  c = c.replace(/<h5 className="text-sm font-semibold[^"]*">/g, '<h4 className="cert-block-label">');
  c = c.replace(/<h5 className="text-sm font-medium[^"]*">/g, '<h4 className="cert-block-label">');
  c = c.replace(/<\/h5>/g, '</h4>');
  
  // 6. Replace background boxes that are light
  c = c.replace(/className="[^"]*bg-slate-50 p-4[^"]*"/g, 'className="cert-block"');
  c = c.replace(/className="[^"]*bg-blue-50\/50 p-4[^"]*"/g, 'className="cert-block"');
  c = c.replace(/className="[^"]*bg-indigo-50\/50 p-4[^"]*"/g, 'className="cert-block"');
  c = c.replace(/className="text-center py-8 text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg"/g, 'className="empty-list-hint"');
  c = c.replace(/className="relative bg-slate-50 p-4 pt-6 rounded-lg border border-slate-200 space-y-4"/g, 'className="relative-row"');
  
  // 7. Remove bg-slate-50 border border-slate-200 from remaining items (if any, like SimultaneousTab.tsx)
  c = c.replace(/className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6"/g, 'className="cert-block"');
  
  fs.writeFileSync(f, c);
});
console.log('Successfully replaced styles in ' + files.length + ' files.');

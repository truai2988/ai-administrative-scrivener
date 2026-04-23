const fs = require('fs');

function parse() {
    const extLinkPath = 'C:/Users/truee/ai-administrative-scrivener/Application_form/在留資格認定証明書/Book7_extracted/xl/externalLinks/externalLink1.xml';
    const wbPath = 'C:/Users/truee/ai-administrative-scrivener/Application_form/在留資格認定証明書/Book7_extracted/xl/workbook.xml';

    const extXml = fs.readFileSync(extLinkPath, 'utf8');
    const wbXml = fs.readFileSync(wbPath, 'utf8');

    // Simple regex parsing since it's fast and we know the structure
    const sheetNames = {};
    const sheetNameMatches = [...extXml.matchAll(/<sheetName val="([^"]+)"\/>/g)];
    sheetNameMatches.forEach((m, idx) => {
        sheetNames[idx] = m[1];
    });

    const cellValues = {};
    // Extract sheetData blocks
    const sheetDataRegex = /<sheetData sheetId="(\d+)">([\s\S]*?)<\/sheetData>/g;
    let sdMatch;
    while ((sdMatch = sheetDataRegex.exec(extXml)) !== null) {
        const sheetId = sdMatch[1];
        const sName = sheetNames[sheetId];
        const content = sdMatch[2];
        
        const cellRegex = /<cell r="([^"]+)"[^>]*><v>(.*?)<\/v><\/cell>/g;
        let cMatch;
        while ((cMatch = cellRegex.exec(content)) !== null) {
            const r = cMatch[1];
            let v = cMatch[2];
            // Decode simple XML entities
            v = v.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
            cellValues[`${sName}!${r}`] = v;
        }
    }

    // Now parse defined names from workbook
    const definedNamesRegex = /<definedName name="([^"]+)"[^>]*>([^<]+)<\/definedName>/g;
    const result = {};
    let dnMatch;
    while ((dnMatch = definedNamesRegex.exec(wbXml)) !== null) {
        const name = dnMatch[1];
        let ref = dnMatch[2];
        
        if (name.endsWith('_L')) {
            // [1]マスタ!$J$3:$J$6 or [1]'マスタ'!$J$3:$J$6
            const refMatch = ref.match(/\[\d+\]'([^']+)'!\$([A-Z]+)\$(\d+):\$([A-Z]+)\$(\d+)|\[\d+\]([^!]+)!\$([A-Z]+)\$(\d+):\$([A-Z]+)\$(\d+)/);
            if (refMatch) {
                let sName = refMatch[1] || refMatch[6];
                let col = refMatch[2] || refMatch[7];
                let startRow = parseInt(refMatch[3] || refMatch[8]);
                let endRow = parseInt(refMatch[5] || refMatch[10]);

                let values = [];
                for (let r = startRow; r <= endRow; r++) {
                    const val = cellValues[`${sName}!${col}${r}`];
                    if (val !== undefined) {
                        values.push(val);
                    }
                }
                if (values.length > 0) {
                    result[name] = values;
                }
            } else {
                // Check for single cell reference
                const singleMatch = ref.match(/\[\d+\]'([^']+)'!\$([A-Z]+)\$(\d+)|\[\d+\]([^!]+)!\$([A-Z]+)\$(\d+)/);
                if (singleMatch) {
                    let sName = singleMatch[1] || singleMatch[4];
                    let col = singleMatch[2] || singleMatch[5];
                    let row = parseInt(singleMatch[3] || singleMatch[6]);
                    const val = cellValues[`${sName}!${col}${row}`];
                    if (val !== undefined) {
                        result[name] = [val];
                    }
                }
            }
        }
    }

    fs.writeFileSync('dropdowns.json', JSON.stringify(result, null, 2), 'utf8');
    console.log(`Extracted ${Object.keys(result).length} dropdowns.`);
}

parse();

import zipfile
import xml.etree.ElementTree as ET
import json
import os
import re

def extract_excel_lists_raw(xlsm_path, output_json):
    temp_dir = "temp_xlsm_extract"
    os.makedirs(temp_dir, exist_ok=True)
    
    with zipfile.ZipFile(xlsm_path, 'r') as zip_ref:
        zip_ref.extractall(temp_dir)
    
    # 1. Parse sharedStrings.xml
    shared_strings = []
    shared_strings_path = os.path.join(temp_dir, 'xl', 'sharedStrings.xml')
    if os.path.exists(shared_strings_path):
        tree = ET.parse(shared_strings_path)
        root = tree.getroot()
        ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        for si in root.findall('ns:si', ns):
            t = si.find('ns:t', ns)
            if t is not None and t.text:
                shared_strings.append(t.text)
            else:
                # might be rich text
                text = "".join([r_t.text for r_t in si.findall('.//ns:t', ns) if r_t.text])
                shared_strings.append(text)
                
    # 2. Parse workbook.xml for definedNames
    workbook_path = os.path.join(temp_dir, 'xl', 'workbook.xml')
    tree = ET.parse(workbook_path)
    root = tree.getroot()
    ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    
    defined_names = {}
    for dn in root.findall('.//ns:definedName', ns):
        name = dn.get('name')
        text = dn.text
        if text and '!' in text:
            # e.g. リスト!$L$49:$L$50
            parts = text.split('!')
            sheet_name = parts[0].strip("'")
            range_str = parts[1].replace('$', '')
            defined_names[name] = {'sheet': sheet_name, 'range': range_str}
            
    # 3. Map sheet names to filenames from workbook.xml and rels
    rels_path = os.path.join(temp_dir, 'xl', '_rels', 'workbook.xml.rels')
    rels_tree = ET.parse(rels_path)
    rels_root = rels_tree.getroot()
    rels_ns = {'ns': 'http://schemas.openxmlformats.org/package/2006/relationships'}
    
    rId_to_target = {}
    for rel in rels_root.findall('ns:Relationship', rels_ns):
        rId_to_target[rel.get('Id')] = rel.get('Target')
        
    sheet_name_to_target = {}
    for sheet in root.findall('.//ns:sheet', ns):
        name = sheet.get('name')
        rId = sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
        if rId in rId_to_target:
            sheet_name_to_target[name] = rId_to_target[rId]
            
    # 4. Helper to get all cells from a sheet
    # We will build a map of { sheet_name: { cell_coord: value } }
    def col_to_num(col_str):
        num = 0
        for c in col_str:
            num = num * 26 + (ord(c) - ord('A') + 1)
        return num
        
    def expand_range(range_str):
        if ':' not in range_str:
            return [range_str]
        
        match = re.match(r'([A-Z]+)(\d+):([A-Z]+)(\d+)', range_str)
        if not match:
            return []
            
        start_col, start_row, end_col, end_row = match.groups()
        start_col_num = col_to_num(start_col)
        end_col_num = col_to_num(end_col)
        
        # Helper to convert num back to col
        def num_to_col(n):
            s = ""
            while n > 0:
                n, remainder = divmod(n - 1, 26)
                s = chr(65 + remainder) + s
            return s
            
        coords = []
        for r in range(int(start_row), int(end_row) + 1):
            for c in range(start_col_num, end_col_num + 1):
                coords.append(f"{num_to_col(c)}{r}")
        return coords

    # 5. Extract values for all named ranges
    result = {}
    
    # Pre-cache sheets
    sheet_caches = {}
    for sheet_name, target in sheet_name_to_target.items():
        # target might be 'worksheets/sheet3.xml'
        sheet_path = os.path.join(temp_dir, 'xl', os.path.basename(target)) if '/' not in target else os.path.join(temp_dir, 'xl', target)
        if not os.path.exists(sheet_path):
            continue
            
        s_tree = ET.parse(sheet_path)
        s_root = s_tree.getroot()
        
        cell_map = {}
        for c in s_root.findall('.//ns:c', ns):
            r = c.get('r')
            t = c.get('t')
            v = c.find('ns:v', ns)
            if v is not None and v.text:
                if t == 's':
                    try:
                        idx = int(v.text)
                        val = shared_strings[idx]
                        cell_map[r] = val
                    except:
                        pass
                else:
                    cell_map[r] = v.text
        sheet_caches[sheet_name] = cell_map

    for name, info in defined_names.items():
        sheet = info['sheet']
        range_str = info['range']
        if sheet in sheet_caches:
            coords = expand_range(range_str)
            values = []
            for coord in coords:
                if coord in sheet_caches[sheet]:
                    values.append(sheet_caches[sheet][coord])
            if values:
                result[name] = values
                
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    import sys
    extract_excel_lists_raw(sys.argv[1], sys.argv[2])

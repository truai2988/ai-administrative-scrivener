import csv
import sys

files = [
    'Application_form/在留期間更新/申請情報入力(在留期間更新許可申請).csv',
    'Application_form/在留期間更新/申請情報入力(区分V).csv',
    'Application_form/在留期間更新/申請情報入力(同時申請).csv'
]

with open('csv_rules.txt', 'w', encoding='utf-8') as out:
    for file_path in files:
        out.write(f"\n--- Rules for {file_path} ---\n")
        try:
            with open(file_path, 'r', encoding='shift_jis', errors='replace') as f:
                reader = csv.reader(f)
                rows = list(reader)
                if len(rows) >= 2:
                    headers = rows[0]
                    rules = rows[1]
                    for i in range(len(headers)):
                        if i < len(rules) and rules[i].strip():
                            out.write(f"[{i}] {headers[i]}: {rules[i]}\n")
        except Exception as e:
            out.write(f"Error processing {file_path}: {e}\n")

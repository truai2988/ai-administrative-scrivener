import csv
import json

files = [
    'Application_form/在留期間更新/申請情報入力(在留期間更新許可申請).csv',
    'Application_form/在留期間更新/申請情報入力(区分V).csv',
    'Application_form/在留期間更新/申請情報入力(同時申請).csv'
]

res = {}
for f in files:
    try:
        with open(f, 'r', encoding='utf-8-sig') as fp:
            reader = csv.reader(fp)
            res[f] = next(reader)
    except Exception as e:
        res[f] = str(e)

with open('scratch/headers_output.json', 'w', encoding='utf-8') as fw:
    json.dump(res, fw, ensure_ascii=False, indent=2)

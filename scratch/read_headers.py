import csv
import glob

files = [
    'Application_form/在留期間更新/申請情報入力(在留期間更新許可申請).csv',
    'Application_form/在留期間更新/申請情報入力(区分V).csv',
    'Application_form/在留期間更新/申請情報入力(同時申請).csv'
]

for f in files:
    try:
        with open(f, encoding='utf-8-sig') as file:
            print(f, file.readline().strip()[:200])
    except Exception as e:
        print(f"Error reading {f} with utf-8-sig: {e}")
        try:
            with open(f, encoding='cp932') as file:
                print(f, file.readline().strip()[:200])
        except Exception as e2:
            print(f"Error reading {f} with cp932: {e2}")


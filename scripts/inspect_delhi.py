import pandas as pd, sys
sys.stdout.reconfigure(encoding='utf-8')

xl = pd.ExcelFile(r'Essential_Medicines_List_2013_Delhi.xlsx')
print('Sheets:', xl.sheet_names)
for sheet in xl.sheet_names:
    df = xl.parse(sheet)
    print(f'\n--- Sheet: {sheet} ({df.shape[0]} rows x {df.shape[1]} cols) ---')
    print('Columns:', list(df.columns))
    print(df.head(10).to_string())

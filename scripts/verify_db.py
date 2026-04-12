import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('data/unified_medicines_database.json', encoding='utf-8') as f:
    db = json.load(f)

print('=== STRUCTURE CHECK ===')
for cat, letters in db.items():
    total = sum(len(v) for v in letters.values())
    print(f'{cat}: {total} entries, {len(letters)} letters')
    if 'A' in letters:
        print(f'  A samples: {letters["A"][:5]}')

print('\n=== VERIFICATION ===')
print('Ashwagandha in Ayurvedic-A?', 'Ashwagandha' in db['Ayurvedic'].get('A', []))
arnica_list = db['Homeopathic'].get('A', [])
found_arnica = any('Arnica' in m for m in arnica_list)
print('Arnica in Homeopathic-A?', found_arnica)
allo_a = db['Allopathic'].get('A', [])
found_amox = any('Amoxicillin' in m for m in allo_a)
found_aug = any('Augmentin' in m for m in allo_a)
print('Amoxicillin in Allopathic-A?', found_amox)
print('Augmentin in Allopathic-A?', found_aug)

print('\n=== HOMEOPATHIC SAMPLES ===')
for letter in sorted(db['Homeopathic'].keys())[:5]:
    print(f'  {letter}: {db["Homeopathic"][letter][:3]}')

print('\n=== AYURVEDIC SAMPLES ===')
for letter in sorted(db['Ayurvedic'].keys())[:5]:
    print(f'  {letter}: {db["Ayurvedic"][letter][:3]}')

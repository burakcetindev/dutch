import json

# Read the file
with open('input/json_action_words.json', 'r') as f:
    content = f.read()

# Remove the comment line at the top
lines = content.split('\n')
json_start = next(i for i, line in enumerate(lines) if line.strip() == '[')
json_content = '\n'.join(lines[json_start:])

# Parse JSON
data = json.loads(json_content)

# Track duplicates
seen = set()
converted = []

for item in data:
    dutch = item.get('dutch', '').strip()
    
    # Skip duplicates
    if dutch.lower() in seen:
        print(f"Skipping duplicate: {dutch}")
        continue
    seen.add(dutch.lower())
    
    # Extract tenses
    tenses = item.get('tenses', {})
    examples = item.get('examples', {})
    short_ex = examples.get('short', {})
    long_ex = examples.get('long', {})
    
    # Build practice array with short and long examples
    practice = []
    if short_ex.get('nl') and short_ex.get('en'):
        practice.append(f"{short_ex['nl']} | {short_ex['en']}")
    if long_ex.get('nl') and long_ex.get('en'):
        practice.append(f"{long_ex['nl']} | {long_ex['en']}")
    
    # Convert to our format
    converted_item = {
        "id": item.get('id', f"{dutch}-{len(converted)}"),
        "dutch": dutch,
        "english": item.get('english', ''),
        "pos": ', '.join(item.get('functions', [])) if item.get('functions') else '',
        "level": item.get('level', 'A1-A2'),
        "categories": item.get('categories', []),
        "functions": item.get('functions', []),
        "contexts": [],
        "grammar": {
            "present": tenses.get('present', ''),
            "past": tenses.get('past', ''),
            "future": tenses.get('future', '')
        },
        "example": {
            "nl": long_ex.get('nl', ''),
            "en": long_ex.get('en', '')
        },
        "progress": "new",
        "practice": practice,
        "notes": ""
    }
    
    converted.append(converted_item)

print(f"\nConverted {len(converted)} items (skipped {len(data) - len(converted)} duplicates)")

# Write the converted file
with open('input/json_action_words.json', 'w') as f:
    json.dump(converted, f, indent=2, ensure_ascii=False)

print("File updated successfully!")

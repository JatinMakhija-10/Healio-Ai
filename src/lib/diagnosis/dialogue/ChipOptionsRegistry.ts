export const CHIP_OPTIONS: Record<string, Record<string, string[]>> = {
  // duration — varies by schema
  duration: {
    fever:          ["Today", "1-2 days", "3-5 days", "6-7 days", "Over a week"],
    headache:       ["Today", "1-3 days", "4-7 days", "1-2 weeks", "Recurring"],
    cough_cold:     ["Today", "1-3 days", "4-7 days", "1-2 weeks", "3+ weeks"],
    mental_health:  ["A few weeks", "1-2 months", "3-6 months", "Over 6 months", "Over a year"],
    skin_rash:      ["Today", "1-3 days", "4-7 days", "1-2 weeks", "Weeks to months"],
    body_pain:      ["Today", "1-3 days", "4-7 days", "1-2 weeks", "Weeks to months", "Other"],
    generic:        ["Today", "1-3 days", "4-7 days", "1-2 weeks", "1-2 months", "3+ months"],
  },
  // sensation — schema-specific, medically accurate
  sensation: {
    fever:          ["Hot/burning skin", "Chills/shivering", "Body aches", "Sweating heavily", "Feeling very cold", "Other"],
    headache:       ["Throbbing/pulsing", "Pressure/tightness", "Sharp/stabbing", "Dull/aching", "One-sided", "Behind eyes", "With light sensitivity", "Other"],
    chest_pain:     ["Tight/squeezing", "Burning", "Sharp/stabbing", "Pressure/heavy", "Dull/aching", "Comes & goes", "Other"],
    abdominal_pain: ["Cramping", "Burning/acidic", "Bloating/gas", "Sharp/stabbing", "Dull/aching", "Nausea/uneasy", "Other"],
    cough_cold:     ["Dry cough", "Wet/mucus cough", "Barking/harsh", "Blocked nose", "Runny nose", "Sore throat", "Wheezing", "Other"],
    skin_rash:      ["Itching", "Burning", "Tingling/numb", "Swollen/raised", "Dry/flaky", "Spreading", "Blistering", "Other"],
    dizziness:      ["Room spinning", "Lightheaded/faint", "Off-balance", "With nausea", "Vision blurry", "Worse on standing", "Other"],
    fatigue:        ["Weak/heavy limbs", "Brain fog", "No energy", "Sleepy all day", "After mild effort", "With body aches", "Other"],
    mental_health:  ["Low mood/sad", "Anxious/worried", "Unable to sleep", "No motivation", "Overwhelmed", "Irritable", "Hopeless", "Other"],
    body_pain:      ["Sharp/stabbing", "Dull/aching", "Throbbing/pulsing", "Stiff/tight", "Swollen/tender", "Cramping", "Burning", "Numbness/tingling", "Other"],
    generic:        ["Sharp/stabbing", "Dull/aching", "Burning", "Throbbing/pulsing", "Pressure/tightness", "Tingling/numb", "Other"],
  },
  // associated symptoms — schema-specific
  associated_symptoms: {
    fever:          ["Headache", "Body aches", "Chills", "Vomiting/nausea", "Sore throat", "Rash", "Burning urine"],
    headache:       ["Nausea/vomiting", "Light sensitivity", "Sound sensitivity", "Neck stiffness", "Vision changes", "Dizziness"],
    chest_pain:     ["Shortness of breath", "Sweating", "Nausea", "Arm/jaw pain", "Palpitations", "Dizziness"],
    abdominal_pain: ["Vomiting", "Diarrhea", "Constipation", "Fever", "Bloating", "Loss of appetite", "Burning urine"],
    cough_cold:     ["Fever", "Sore throat", "Runny nose", "Body aches", "Headache", "Ear pain", "Wheezing"],
    skin_rash:      ["Fever", "Itching", "Swelling", "Discharge/pus", "Joint pain", "Spreading", "New areas"],
    dizziness:      ["Nausea/vomiting", "Headache", "Ear ringing", "Hearing loss", "Sweating", "Palpitations"],
    mental_health:  ["Sleep problems", "Low appetite", "Poor concentration", "Fatigue", "Irritability", "Social withdrawal"],
    body_pain:      ["Swelling", "Stiffness", "Warmth/redness", "Numbness/tingling", "Weakness", "Fever", "None"],
    generic:        ["Fever", "Nausea", "Dizziness", "Fatigue/weakness", "Headache", "Loss of appetite"],
  },
  // aggravation — what makes it worse
  aggravation: {
    fever:          ["Movement/activity", "Hot environment", "Eating", "At night", "Not drinking enough", "Other"],
    headache:       ["Bright light", "Loud noise", "Movement", "Stress", "Screen time", "Lack of sleep", "Skipping meals", "Other"],
    chest_pain:     ["Walking/climbing stairs", "Lying down", "After eating", "Stress/anxiety", "Deep breathing", "Other"],
    abdominal_pain: ["After eating", "Before bowel movement", "Fatty/spicy food", "Stress", "Movement", "Other"],
    cough_cold:     ["At night", "Cold air", "Lying down", "Exercise", "Dust/smoke", "After eating", "Other"],
    skin_rash:      ["Scratching", "Heat/sweating", "Certain fabrics", "Water/bathing", "Sunlight", "Stress", "Other"],
    dizziness:      ["Standing up quickly", "Head movement", "Lying down", "After eating", "Exercise", "Other"],
    mental_health:  ["Crowded places", "Work/study pressure", "Poor sleep", "Social situations", "Mornings", "Other"],
    body_pain:      ["Movement/activity", "Bearing weight", "Touch/pressure", "Bending/stretching", "Cold weather", "In the morning", "At night", "Other"],
    generic:        ["Movement", "Stress", "After eating", "Heat", "Cold", "Lying down", "Physical activity", "Other"],
  },
  // amelioration — what gives relief
  amelioration: {
    fever:          ["Cold compress/wet cloth", "Paracetamol", "Rest", "Drinking water/fluids", "Cooling the room", "Other"],
    headache:       ["Rest in dark/quiet room", "Sleep", "Paracetamol/ibuprofen", "Cold compress", "Coffee", "Pressure on temples", "Other"],
    chest_pain:     ["Rest", "Antacid", "Sitting upright", "Deep breathing", "Nothing helps yet", "Other"],
    abdominal_pain: ["Rest", "Heat pad", "Antacid", "Passing gas/stool", "Avoiding food", "Drinking water", "Other"],
    cough_cold:     ["Warm fluids/steam", "Honey", "Rest", "Cough syrup", "Fresh air", "Sleeping propped up", "Other"],
    skin_rash:      ["Cold compress", "Antihistamine", "Moisturizer", "Avoiding scratching", "Calamine lotion", "Other"],
    dizziness:      ["Lying still", "Drinking water", "Eating something", "Sitting down", "Fresh air", "Other"],
    mental_health:  ["Talking to someone", "Exercise", "Sleep", "Distraction/hobby", "Music/TV", "Nothing yet", "Other"],
    body_pain:      ["Rest", "Ice compress", "Warm compress/bath", "Gentle stretching", "Massage", "Painkillers/ointment", "Elevating the limb", "Other"],
    generic:        ["Rest", "Heat/warm compress", "Cold compress", "Medication", "Sleep", "Drinking water", "Nothing yet", "Other"],
  },
};

export function resolveChipOptionsForSchema(questionType: string, schemaId: string): string[] {
    const category = CHIP_OPTIONS[questionType];
    if (!category) return [];
    
    // Check if the specific schema exists in this category, otherwise use generic
    const options = category[schemaId] || category['generic'] || [];
    return options;
}

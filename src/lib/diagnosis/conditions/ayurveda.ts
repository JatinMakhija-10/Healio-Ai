import { Condition } from "../types";

/**
 * Ayurvedic and Traditional Indian Medicine Conditions
 * These conditions focus on traditional Ayurvedic approaches and remedies
 */
export const ayurvedaConditions: Record<string, Condition> = {
    vata_imbalance: {
        id: 'vata_imbalance',
        name: 'Vata Imbalance (Dry, Cold, Restless)',
        description: 'Ayurvedic condition characterized by dryness, anxiety, irregular digestion, and restlessness',
        matchCriteria: {
            locations: ['body', 'joints', 'skin', 'head'],
            types: ['dry', 'cold', 'restless', 'irregular', 'crackling'],
            triggers: ['cold weather', 'dry weather', 'travel', 'irregular routine', 'excessive thinking', 'stress'],
            specialSymptoms: ['dry skin', 'constipation', 'anxiety', 'insomnia', 'joint cracking', 'weight loss', 'irregular appetite']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Warm Oil Massage (Abhyanga)',
                description: 'Daily self-massage with warm oil',
                ingredients: ['Sesame oil (warmed)'],
                method: 'Apply warm oil all over body. Massage in circular motions on joints, long strokes on limbs.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ghee in Diet',
                description: 'Internal lubrication for Vata',
                ingredients: ['Pure cow ghee'],
                method: 'Add 1-2 tsp ghee to rice, dal, or roti. Consume with warm meals.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ashwagandha with Warm Milk',
                description: 'Premier Vata-pacifying herb',
                ingredients: ['Ashwagandha powder', 'Warm milk', 'Ghee', 'Jaggery'],
                method: 'Mix 1/2 tsp ashwagandha in warm milk with ghee and jaggery. Drink at bedtime.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Dashmool Kwath',
                description: 'Classical Ayurvedic decoction for Vata',
                ingredients: ['Dashmool powder (10 roots formula)', 'Water'],
                method: 'Boil 1 tsp dashmool in 2 cups water until reduced to 1 cup. Strain and drink.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Bala (Sida cordifolia) Milk',
                description: 'Strengthening and grounding',
                ingredients: ['Bala powder', 'Milk', 'Ghee'],
                method: 'Boil 1/4 tsp bala in milk with ghee. Drink warm.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Warm Sesame Oil Nasya',
                description: 'Nasal drops for mental clarity',
                ingredients: ['Sesame oil or Anu Taila'],
                method: 'Put 2 drops of warm oil in each nostril in morning.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Gentle Yoga',
                description: 'Slow, grounding practices',
                duration: '20-30 minutes',
                frequency: 'Daily, preferably morning'
            },
            {
                name: 'Pranayama (Nadi Shodhana)',
                description: 'Alternate nostril breathing for balance',
                duration: '10 minutes',
                frequency: 'Morning and evening'
            },
            {
                name: 'Walking',
                description: 'Grounding outdoor activity',
                duration: '20-30 minutes',
                frequency: 'Daily, in nature if possible'
            }
        ],
        warnings: ['Avoid cold, dry, raw foods', 'Maintain regular routine', 'Keep warm', 'Avoid excessive travel'],
        seekHelp: 'If symptoms persist despite lifestyle changes or significantly impact daily function'
    },

    pitta_imbalance: {
        id: 'pitta_imbalance',
        name: 'Pitta Imbalance (Heat, Inflammation)',
        description: 'Ayurvedic condition characterized by excess heat, acidity, skin rashes, and irritability',
        matchCriteria: {
            locations: ['stomach', 'skin', 'eyes', 'head'],
            types: ['burning', 'hot', 'inflamed', 'sharp', 'acidic'],
            triggers: ['spicy food', 'hot weather', 'sun exposure', 'alcohol', 'anger', 'competitive stress'],
            specialSymptoms: ['acidity', 'heartburn', 'skin rashes', 'excessive sweating', 'irritability', 'anger', 'loose stools', 'premature greying']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Cooling Diet',
                description: 'Favor sweet, bitter, astringent tastes',
                ingredients: ['Cucumber', 'Coconut', 'Melons', 'Leafy greens'],
                method: 'Include cooling foods in daily diet. Avoid spicy, sour, salty foods.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Amla (Indian Gooseberry)',
                description: 'Premier Pitta-pacifying fruit',
                ingredients: ['Fresh amla or amla powder', 'Honey'],
                method: 'Eat 1 fresh amla daily or take 1 tsp powder with honey.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Shatavari with Milk',
                description: 'Cooling and nourishing herb',
                ingredients: ['Shatavari powder', 'Cool milk', 'Mishri (rock sugar)'],
                method: 'Mix 1/2 tsp shatavari in cool milk with mishri. Drink in morning.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Aloe Vera Juice',
                description: 'Cooling for digestive fire',
                ingredients: ['Fresh aloe vera gel', 'Water'],
                method: 'Mix 2 tbsp aloe gel in water. Drink in morning on empty stomach.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Chandan (Sandalwood) Paste',
                description: 'Cooling application for skin',
                ingredients: ['Sandalwood powder', 'Rose water'],
                method: 'Make paste. Apply on skin or forehead for cooling effect.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Gulkand (Rose Petal Preserve)',
                description: 'Sweet cooling remedy',
                ingredients: ['Gulkand', 'Milk'],
                method: 'Take 1 tsp gulkand with milk at bedtime.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Coconut Water',
                description: 'Natural coolant',
                ingredients: ['Fresh coconut water'],
                method: 'Drink 1-2 glasses daily, preferably in afternoon.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Sheetali Pranayama (Cooling Breath)',
                description: 'Reduces body heat',
                duration: '5-10 minutes',
                frequency: 'During hot weather or when feeling heated'
            },
            {
                name: 'Moonlight Walking',
                description: 'Cooling evening activity',
                duration: '20-30 minutes',
                frequency: 'Evening, avoid midday sun'
            },
            {
                name: 'Swimming',
                description: 'Cooling exercise',
                duration: '30 minutes',
                frequency: '2-3 times per week'
            }
        ],
        warnings: ['Avoid hot, spicy, sour foods', 'Stay out of midday sun', 'Avoid excessive competition', 'Limit alcohol'],
        seekHelp: 'If skin issues worsen, digestive problems persist, or anger becomes difficult to control'
    },

    kapha_imbalance: {
        id: 'kapha_imbalance',
        name: 'Kapha Imbalance (Heaviness, Congestion)',
        description: 'Ayurvedic condition characterized by heaviness, congestion, lethargy, and weight gain',
        matchCriteria: {
            locations: ['chest', 'head', 'stomach', 'body'],
            types: ['heavy', 'congested', 'sluggish', 'dull', 'thick'],
            triggers: ['cold weather', 'damp weather', 'excessive sleep', 'overeating', 'dairy', 'sweets', 'sedentary lifestyle'],
            specialSymptoms: ['congestion', 'excessive mucus', 'weight gain', 'lethargy', 'depression', 'slow digestion', 'water retention']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Stimulating Diet',
                description: 'Favor pungent, bitter, astringent tastes',
                ingredients: ['Ginger', 'Pepper', 'Bitter greens', 'Legumes'],
                method: 'Include warming, light foods. Reduce heavy, oily, sweet, cold foods.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Trikatu Churna',
                description: 'Three pungents formula for digestion and metabolism',
                ingredients: ['Trikatu powder (ginger, black pepper, pippali)', 'Honey'],
                method: 'Take 1/4 tsp with honey before meals.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Warm Honey Water',
                description: 'Dissolves Kapha, aids metabolism',
                ingredients: ['Raw honey', 'Warm (not hot) water'],
                method: 'Mix 1 tsp honey in glass of warm water. Drink in morning.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Punarnava (Boerhavia diffusa)',
                description: 'Reduces water retention',
                ingredients: ['Punarnava powder', 'Warm water'],
                method: 'Take 1/2 tsp with warm water twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Guggulu',
                description: 'Classical Ayurvedic resin for metabolism',
                ingredients: ['Triphala Guggulu or Kanchanar Guggulu tablets'],
                method: 'Take 2 tablets with warm water after meals. (Consult practitioner for dose)',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Dry Ginger (Sonth) Tea',
                description: 'Kindles digestive fire, clears congestion',
                ingredients: ['Dry ginger powder', 'Hot water', 'Honey'],
                method: 'Boil 1/2 tsp sonth in water. Add honey when warm.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Tulsi-Black Pepper Tea',
                description: 'Clears respiratory congestion',
                ingredients: ['Tulsi leaves', 'Black pepper', 'Ginger', 'Water'],
                method: 'Boil all ingredients. Strain and drink 2-3 times daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Vigorous Exercise',
                description: 'Stimulating physical activity',
                duration: '30-45 minutes',
                frequency: 'Daily, preferably morning'
            },
            {
                name: 'Kapalabhati Pranayama',
                description: 'Skull-shining breath for energy',
                duration: '5-10 minutes',
                frequency: 'Morning, on empty stomach'
            },
            {
                name: 'Sun Salutations (Surya Namaskar)',
                description: 'Energizing yoga sequence',
                duration: '12 rounds',
                frequency: 'Daily morning'
            }
        ],
        warnings: ['Avoid daytime sleeping', 'Reduce heavy, oily, sweet foods', 'Stay active', 'Avoid cold, damp environments'],
        seekHelp: 'If respiratory issues persist, weight gain is significant, or depression worsens'
    },

    weak_digestion: {
        id: 'weak_digestion',
        name: 'Weak Digestion (Mandagni)',
        description: 'Low digestive fire causing slow metabolism and incomplete digestion',
        matchCriteria: {
            locations: ['stomach', 'abdomen'],
            types: ['weak', 'slow', 'heavy', 'sluggish'],
            triggers: ['overeating', 'cold food', 'irregular eating', 'eating when not hungry'],
            specialSymptoms: ['feeling heavy after meals', 'slow digestion', 'low appetite', 'coating on tongue', 'fatigue after eating']
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Eat When Hungry',
                description: 'Wait for true hunger before eating',
                ingredients: [],
                method: 'Only eat when previous meal is fully digested.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ginger Appetizer',
                description: 'Kindles digestive fire before meals',
                ingredients: ['Fresh ginger', 'Lemon juice', 'Rock salt'],
                method: 'Chew a thin slice of ginger with lemon and salt 15 mins before meals.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Hingvastak Churna',
                description: 'Classical digestive formula',
                ingredients: ['Hingvastak churna (available in Ayurvedic stores)'],
                method: 'Take 1/2 tsp with first bite of food.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Buttermilk (Takra)',
                description: 'Light, digestive drink',
                ingredients: ['Fresh curd', 'Water', 'Cumin powder', 'Salt', 'Curry leaves'],
                method: 'Churn 1 part curd with 3 parts water. Add spices. Drink after lunch.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'CCF Tea (Cumin-Coriander-Fennel)',
                description: 'Gentle digestive tea',
                ingredients: ['Cumin seeds', 'Coriander seeds', 'Fennel seeds', 'Water'],
                method: 'Boil equal parts of all three seeds. Strain. Sip throughout day.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Chitrakadi Vati',
                description: 'Classical appetite stimulant',
                ingredients: ['Chitrakadi vati tablets'],
                method: 'Take 1-2 tablets before meals with warm water.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Walking After Meals',
                description: 'Aids digestion',
                duration: '10-15 minutes',
                frequency: 'After lunch and dinner'
            },
            {
                name: 'Vajrasana After Meals',
                description: 'Yoga pose for digestion',
                duration: '5-10 minutes',
                frequency: 'After meals'
            }
        ],
        warnings: ['Avoid cold foods and drinks', 'Do not overeat', 'Eat at regular times', 'Avoid eating when stressed'],
        seekHelp: 'If accompanied by significant weight loss, blood in stool, or persistent pain'
    },

    ama_toxicity: {
        id: 'ama_toxicity',
        name: 'Ama (Metabolic Toxins)',
        description: 'Accumulation of undigested material causing fatigue, heaviness, and body aches',
        matchCriteria: {
            locations: ['body', 'joints', 'tongue', 'stomach'],
            types: ['heavy', 'sticky', 'foggy', 'achy'],
            triggers: ['poor digestion', 'overeating', 'wrong food combinations', 'processed food', 'eating late'],
            specialSymptoms: ['white coating on tongue', 'body aches', 'brain fog', 'bad breath', 'lethargy', 'joint stiffness in morning', 'foul smelling stools']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Light Fasting',
                description: 'Allow digestive fire to burn ama',
                ingredients: [],
                method: 'Skip breakfast or have only liquids for a day.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Hot Water Sipping',
                description: 'Dissolves and flushes ama',
                ingredients: ['Plain hot water'],
                method: 'Sip hot water every 30 minutes throughout the day.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Triphala at Night',
                description: 'Classical detoxifier',
                ingredients: ['Triphala powder', 'Hot water'],
                method: 'Take 1 tsp triphala with hot water before bed.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ginger-Lemon-Honey Morning Drink',
                description: 'Kindles agni and clears ama',
                ingredients: ['Fresh ginger', 'Lemon', 'Honey', 'Warm water'],
                method: 'Mix ginger juice, lemon, and honey in warm water. Drink in morning.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Langhan (Therapeutic Fasting)',
                description: 'Controlled fasting to burn ama',
                ingredients: ['Rice water (kanji)', 'Mung dal soup'],
                method: 'Eat only light foods like kanji or mung soup for 1-3 days.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Pachak Herbs',
                description: 'Digestive herbs that burn ama',
                ingredients: ['Trikatu', 'Pippalyadi churna', 'Warm water'],
                method: 'Take 1/4 tsp before meals.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Vigorous Walking',
                description: 'Increases metabolic fire',
                duration: '30-45 minutes',
                frequency: 'Daily morning'
            },
            {
                name: 'Surya Namaskar',
                description: 'Generates internal heat',
                duration: '12-24 rounds',
                frequency: 'Morning, on empty stomach'
            },
            {
                name: 'Twist Yoga Poses',
                description: 'Helps detoxify digestive organs',
                duration: '10-15 minutes',
                frequency: 'Daily'
            }
        ],
        warnings: ['Avoid heavy, oily, cold foods', 'Do not suppress urges', 'Avoid sleeping during day', 'Eat only when hungry'],
        seekHelp: 'If symptoms persist beyond 2 weeks or are accompanied by fever'
    },

    // ============ DHATU (TISSUE) IMBALANCES ============

    rasa_dhatu_imbalance: {
        id: 'rasa_dhatu_imbalance',
        name: 'Rasa Dhatu Imbalance (Plasma/Lymph)',
        description: 'Imbalance in the first tissue layer affecting nutrition, immunity, and hydration',
        matchCriteria: {
            locations: ['body', 'skin', 'face', 'chest'],
            types: ['dry', 'dehydrated', 'weak', 'tired'],
            triggers: ['poor diet', 'dehydration', 'stress', 'fasting', 'irregular meals'],
            specialSymptoms: ['dry skin', 'fatigue', 'poor immunity', 'dull complexion', 'lack of enthusiasm', 'irregular heartbeat', 'thirst']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Hydration Protocol',
                description: 'Proper hydration with digestive support',
                ingredients: ['Water', 'Electrolytes'],
                method: 'Drink warm water throughout the day. Add a pinch of Himalayan salt and lemon.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Rasa-Nourishing Diet',
                description: 'Sweet, cooling foods to nourish plasma',
                ingredients: ['Dates', 'Milk', 'Ghee', 'Sweet fruits'],
                method: 'Include sweet, juicy fruits and warm milk with ghee daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Shatavari Rasayana',
                description: 'Premier herb for Rasa Dhatu',
                ingredients: ['Shatavari powder', 'Warm milk', 'Honey'],
                method: 'Take 1/2 tsp Shatavari with warm milk twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Draksha (Raisin) Water',
                description: 'Nourishes and hydrates Rasa',
                ingredients: ['Raisins (20)', 'Water'],
                method: 'Soak raisins overnight. Eat raisins and drink water in morning.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Gentle Walking',
                description: 'Light exercise to improve circulation',
                duration: '20 minutes',
                frequency: 'Daily, gentle pace'
            }
        ],
        warnings: ['Avoid skipping meals', 'Stay hydrated', 'Avoid excessive fasting', 'Get adequate rest'],
        seekHelp: 'If chronic fatigue persists or immunity remains compromised'
    },

    rakta_dhatu_imbalance: {
        id: 'rakta_dhatu_imbalance',
        name: 'Rakta Dhatu Imbalance (Blood)',
        description: 'Blood tissue imbalance causing inflammation, skin issues, and heat-related problems',
        matchCriteria: {
            locations: ['skin', 'blood', 'liver', 'spleen', 'body'],
            types: ['burning', 'inflamed', 'hot', 'itchy', 'red'],
            triggers: ['spicy food', 'alcohol', 'hot weather', 'anger', 'sour food'],
            specialSymptoms: ['skin eruptions', 'bleeding disorders', 'inflammation', 'acne', 'rosacea', 'excessive body heat', 'blood pressure issues']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Blood-Cooling Diet',
                description: 'Pitta-pacifying foods',
                ingredients: ['Bitter greens', 'Pomegranate', 'Aloe'],
                method: 'Include bitter vegetables, pomegranate, and cooling foods.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Manjistha (Indian Madder)',
                description: 'Premier blood purifier in Ayurveda',
                ingredients: ['Manjistha powder', 'Warm water'],
                method: 'Take 1/2 tsp with warm water twice daily, before meals.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Neem Blood Purifier',
                description: 'Classical blood cleanser',
                ingredients: ['Neem leaves or powder', 'Water'],
                method: 'Take 2-3 tender neem leaves morning empty stomach or 1/4 tsp powder.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Sariva (Anantamul) Decoction',
                description: 'Cooling blood tonic',
                ingredients: ['Sariva powder', 'Water'],
                method: 'Boil 1 tsp in 2 cups water. Reduce to 1 cup. Drink twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Aloe Vera Juice',
                description: 'Cooling and blood purifying',
                ingredients: ['Fresh aloe gel', 'Water'],
                method: 'Mix 2 tbsp fresh gel in water. Drink morning on empty stomach.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Sheetali Pranayama',
                description: 'Cooling breath technique',
                duration: '5-10 minutes',
                frequency: 'Morning and evening'
            },
            {
                name: 'Moonlight Walking',
                description: 'Cooling evening exercise',
                duration: '20 minutes',
                frequency: 'Evening'
            }
        ],
        warnings: ['Avoid spicy, sour, salty foods', 'Limit alcohol', 'Stay out of midday sun', 'Manage anger'],
        seekHelp: 'If skin conditions worsen or bleeding problems develop'
    },

    meda_dhatu_imbalance: {
        id: 'meda_dhatu_imbalance',
        name: 'Meda Dhatu Imbalance (Fat Tissue)',
        description: 'Adipose tissue imbalance causing weight issues, metabolic problems, and joint stress',
        matchCriteria: {
            locations: ['body', 'abdomen', 'joints', 'waist'],
            types: ['heavy', 'sluggish', 'obese', 'fatty'],
            triggers: ['overeating', 'sedentary lifestyle', 'excess sweets', 'daytime sleep', 'lack of exercise'],
            specialSymptoms: ['weight gain', 'fatty deposits', 'high cholesterol', 'excessive sweating', 'body odor', 'diabetes tendency', 'joint pain from weight']
        },
        severity: 'moderate',
        remedies: [
            {
                name: 'Weight Management Diet',
                description: 'Kapha-reducing, metabolism-boosting diet',
                ingredients: ['Light grains', 'Vegetables', 'Spices'],
                method: 'Favor light, warm, dry foods. Reduce oils, sweets, and heavy foods.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Medohar Guggulu',
                description: 'Classical Ayurvedic formula for metabolism',
                ingredients: ['Medohar Guggulu tablets'],
                method: 'Take 2 tablets twice daily with warm water. Consult practitioner for duration.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Triphala Guggulu',
                description: 'Fat metabolism and detoxification',
                ingredients: ['Triphala Guggulu tablets', 'Warm water'],
                method: 'Take 2 tablets after meals with warm water.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Warm Honey-Lemon Water',
                description: 'Metabolism booster',
                ingredients: ['Warm water', 'Honey (1 tsp)', 'Lemon juice'],
                method: 'Mix in warm (not hot) water. Drink on empty stomach every morning.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Vidanga (Embelia ribes)',
                description: 'Fat-scraping herb (Lekhana)',
                ingredients: ['Vidanga powder', 'Honey'],
                method: 'Take 1/2 tsp with honey before meals.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Vigorous Cardio',
                description: 'Burns fat and improves metabolism',
                duration: '30-45 minutes',
                frequency: 'Daily, morning preferred'
            },
            {
                name: 'Surya Namaskar',
                description: 'Full body workout',
                duration: '12-24 rounds',
                frequency: 'Morning, empty stomach'
            },
            {
                name: 'Kapalabhati',
                description: 'Abdominal fat reduction',
                duration: '5-10 minutes',
                frequency: 'Morning, empty stomach'
            }
        ],
        warnings: ['Avoid daytime sleep', 'No heavy or late dinners', 'Exercise regularly', 'Limit sweet and oily foods'],
        seekHelp: 'If unable to lose weight despite efforts or metabolic markers worsen'
    },

    // ============ AGNI (DIGESTIVE FIRE) TYPES ============

    tikshna_agni: {
        id: 'tikshna_agni',
        name: 'Tikshna Agni (Sharp/Excessive Digestion)',
        description: 'Overactive digestive fire causing excessive hunger, acidity, and burning sensations',
        matchCriteria: {
            locations: ['stomach', 'abdomen', 'chest'],
            types: ['burning', 'hot', 'sharp', 'acidic'],
            triggers: ['missing meals', 'spicy food', 'hot weather', 'anger', 'stress'],
            specialSymptoms: ['excessive hunger', 'acidity', 'heartburn', 'hypoglycemia symptoms', 'irritability when hungry', 'loose stools', 'burning sensation']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Regular Meal Timing',
                description: 'Prevent hunger spikes',
                ingredients: [],
                method: 'Never skip meals. Eat at regular intervals to prevent Agni flare-ups.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Shatavari for Cooling',
                description: 'Cools digestive fire',
                ingredients: ['Shatavari powder', 'Cool milk', 'Mishri'],
                method: 'Mix 1/2 tsp Shatavari in cool milk with mishri. Take twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Amalaki (Amla) Churna',
                description: 'Balances Pitta without suppressing Agni',
                ingredients: ['Amalaki powder', 'Cool water or milk'],
                method: 'Take 1/2 tsp with cool water between meals.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Yashtimadhu (Licorice) with Ghee',
                description: 'Soothes burning and protects stomach',
                ingredients: ['Yashtimadhu powder', 'Ghee', 'Warm milk'],
                method: 'Mix 1/4 tsp powder with 1/2 tsp ghee in milk. Take at bedtime.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Avipattikar Churna',
                description: 'Classical formula for hyperacidity',
                ingredients: ['Avipattikar churna', 'Cool water'],
                method: 'Take 1 tsp with cool water after meals.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Sheetali Pranayama',
                description: 'Cooling breath',
                duration: '5-10 minutes',
                frequency: 'When feeling heated or before meals'
            },
            {
                name: 'Moderate Exercise',
                description: 'Avoid overheating during exercise',
                duration: '20-30 minutes',
                frequency: 'Morning, before heat of day'
            }
        ],
        warnings: ['Never skip meals', 'Avoid spicy, sour, fermented foods', 'Eat cooling foods', 'Manage anger'],
        seekHelp: 'If acidity is severe or accompanied by ulcer-like symptoms'
    },

    vishama_agni: {
        id: 'vishama_agni',
        name: 'Vishama Agni (Irregular Digestion)',
        description: 'Variable digestive fire causing unpredictable appetite and digestion',
        matchCriteria: {
            locations: ['stomach', 'abdomen', 'intestines'],
            types: ['irregular', 'variable', 'cramping', 'bloating'],
            triggers: ['irregular routine', 'travel', 'stress', 'cold food', 'raw food'],
            specialSymptoms: ['variable appetite', 'gas', 'bloating', 'constipation', 'abdominal discomfort', 'gurgling sounds', 'irregular bowel movements']
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Establish Regular Routine',
                description: 'Regularity stabilizes Vata-driven irregular Agni',
                ingredients: [],
                method: 'Eat meals at the same time daily. Main meal at noon when Agni is strongest.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ginger-Ajwain Digestive',
                description: 'Kindle and regulate Agni',
                ingredients: ['Fresh ginger', 'Ajwain seeds', 'Rock salt'],
                method: 'Chew grated ginger with ajwain and salt 15 mins before meals.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Hingvastak Churna',
                description: 'Classical Vata-digestive formula',
                ingredients: ['Hingvastak churna', 'Ghee'],
                method: 'Mix 1/2 tsp with a little ghee. Take with first bite of food.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Warm Water Sipping',
                description: 'Stabilizes Agni throughout day',
                ingredients: ['Hot water'],
                method: 'Sip warm to hot water throughout the day, especially before meals.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ashta Churna',
                description: 'Eight spice digestive formula',
                ingredients: ['Ashta churna (black pepper, ginger, cumin, etc.)'],
                method: 'Sprinkle on food or take 1/4 tsp before meals.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Pavanamuktasana',
                description: 'Wind-relieving pose',
                duration: '5 minutes',
                frequency: 'After meals or when bloated'
            },
            {
                name: 'Gentle Walking After Meals',
                description: 'Aids digestion',
                duration: '10-15 minutes',
                frequency: 'After each main meal'
            }
        ],
        warnings: ['Maintain regular eating schedule', 'Avoid cold, raw foods', 'Minimize travel', 'Reduce stress'],
        seekHelp: 'If digestive irregularity is chronic or accompanied by significant weight changes'
    },

    // ============ OJAS (VITALITY) ============

    ojas_depletion: {
        id: 'ojas_depletion',
        name: 'Ojas Depletion (Low Vitality/Immunity)',
        description: 'Depletion of the essence of bodily tissues causing low immunity, weakness, and vulnerability',
        matchCriteria: {
            locations: ['body', 'heart', 'head'],
            types: ['weak', 'depleted', 'tired', 'vulnerable'],
            triggers: ['overwork', 'chronic stress', 'trauma', 'excessive fasting', 'disease', 'grief', 'excessive ejaculation'],
            specialSymptoms: ['chronic fatigue', 'frequent illness', 'weakness', 'fear', 'anxiety', 'dryness', 'emaciation', 'weak voice', 'poor complexion']
        },
        severity: 'moderate-severe',
        remedies: [
            {
                name: 'Ojas-Building Protocol',
                description: 'Rest, nourishment, and rejuvenation',
                ingredients: [],
                method: 'Prioritize rest, reduce stress, and focus on nourishing practices.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Chyawanprash Rasayana',
                description: 'Premier Ojas-building formula',
                ingredients: ['Chyawanprash (1-2 tsp)', 'Warm milk'],
                method: 'Take 1-2 tsp with warm milk every morning.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ashwagandha Rasayana',
                description: 'Strength and Ojas builder',
                ingredients: ['Ashwagandha powder', 'Ghee', 'Warm milk', 'Honey'],
                method: 'Mix 1/2 tsp with ghee in warm milk. Take at bedtime.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ojas-Building Milk',
                description: 'Traditional rejuvenation drink',
                ingredients: ['Warm milk', 'Ghee', 'Almonds (soaked, peeled)', 'Saffron', 'Cardamom'],
                method: 'Blend soaked almonds with warm milk. Add saffron, cardamom, and ghee. Drink at bedtime.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Brahma Rasayana',
                description: 'Mind and Ojas rejuvenator',
                ingredients: ['Brahma Rasayana paste'],
                method: 'Take 1/2 - 1 tsp with warm milk. (Available in Ayurvedic stores)',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Shatavari-Ghee Rasayana',
                description: 'Deep nourishment',
                ingredients: ['Shatavari ghrita', 'Warm milk'],
                method: 'Take 1 tsp with warm milk twice daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Restorative Yoga',
                description: 'Gentle, supported poses',
                duration: '30-40 minutes',
                frequency: 'Daily'
            },
            {
                name: 'Yoga Nidra',
                description: 'Deep relaxation for recovery',
                duration: '30-45 minutes',
                frequency: 'Daily'
            },
            {
                name: 'Gentle Pranayama',
                description: 'Nadi Shodhana for balance',
                duration: '10 minutes',
                frequency: 'Twice daily'
            }
        ],
        warnings: ['Avoid overexertion', 'Prioritize sleep', 'Reduce stress', 'Avoid fasting', 'Practice celibacy or moderation'],
        seekHelp: 'If weakness is severe or accompanied by unexplained weight loss'
    },

    // ============ DOSHA VIKRITI (IMBALANCE) ============

    vikriti_diagnosis: {
        id: 'vikriti_diagnosis',
        name: 'Doshic Vikriti (Current Imbalance)',
        description: 'Current state of doshic imbalance requiring personalized Ayurvedic intervention',
        matchCriteria: {
            locations: ['body', 'mind'],
            types: ['imbalanced', 'disturbed', 'aggravated'],
            triggers: ['seasonal change', 'wrong diet', 'wrong lifestyle', 'stress', 'travel'],
            specialSymptoms: ['symptoms not matching usual pattern', 'new health issues', 'feeling out of balance', 'seasonal symptoms']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Dosha-Specific Balancing',
                description: 'Based on current imbalance determination',
                ingredients: [],
                method: 'Identify aggravated dosha and follow opposite qualities in diet and lifestyle.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Triphala for Balance',
                description: 'Tri-doshic balancer',
                ingredients: ['Triphala powder', 'Warm water'],
                method: 'Take 1 tsp with warm water before bed. Balances all three doshas.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Seasonal Detox (Ritucharya)',
                description: 'Seasonal cleansing',
                ingredients: ['Light diet', 'Warm water', 'Rest'],
                method: 'During seasonal transitions, eat light, rest more, and increase warm water intake.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Panchakarma Consultation',
                description: 'Deep cleansing therapy',
                ingredients: [],
                method: 'For chronic imbalance, consult an Ayurvedic practitioner for Panchakarma.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Yoga Based on Dosha',
                description: 'Tailored practice for current imbalance',
                duration: '20-30 minutes',
                frequency: 'Daily'
            },
            {
                name: 'Pranayama for Balance',
                description: 'Alternate nostril breathing',
                duration: '10-15 minutes',
                frequency: 'Morning and evening'
            }
        ],
        warnings: ['Change diet and lifestyle gradually', 'Observe body signals', 'Follow seasonal routines', 'Consult practitioner for chronic issues'],
        seekHelp: 'If imbalance persists despite lifestyle changes or symptoms are severe'
    },

    sama_vata: {
        id: 'sama_vata',
        name: 'Sama Vata (Vata with Toxins)',
        description: 'Vata dosha combined with Ama (toxins) causing pain, stiffness, and digestive issues',
        matchCriteria: {
            locations: ['joints', 'abdomen', 'lower back', 'colon'],
            types: ['painful', 'stiff', 'bloated', 'heavy'],
            triggers: ['cold weather', 'irregular eating', 'indigestion', 'constipation'],
            specialSymptoms: ['joint pain with heaviness', 'constipation with bloating', 'coated tongue', 'morning stiffness', 'gas with bad odor', 'malaise']
        },
        severity: 'moderate',
        remedies: [
            {
                name: 'Ama-Reducing Then Vata-Pacifying',
                description: 'Two-phase approach',
                ingredients: [],
                method: 'First reduce Ama with light diet and fasting, then nourish Vata.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ginger-Castor Oil Therapy',
                description: 'Clears Ama from Vata zones',
                ingredients: ['Dry ginger powder', 'Castor oil'],
                method: 'Take 1 tsp castor oil with dry ginger tea at bedtime (occasional use only).',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Rasna Saptak Kwath',
                description: 'Classical formula for Sama Vata',
                ingredients: ['Rasna Saptak Kwath powder'],
                method: 'Prepare decoction as per instructions. Take twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Hot Water Fasting',
                description: 'Clear Ama before nourishing',
                ingredients: ['Hot water', 'Ginger'],
                method: 'Fast on hot ginger water for half to one day, then resume light diet.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Gentle Yoga with Twists',
                description: 'Clear stagnation',
                duration: '15-20 minutes',
                frequency: 'Daily'
            },
            {
                name: 'Walking',
                description: 'Move stagnant energy',
                duration: '30 minutes',
                frequency: 'Daily'
            }
        ],
        warnings: ['Avoid cold foods', 'Do not overeat', 'Light diet until Ama clears', 'Keep joints warm'],
        seekHelp: 'If joint pain is severe or accompanied by swelling'
    }
};


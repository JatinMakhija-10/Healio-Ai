/**
 * Healio.AI - Condition Database
 * Maps symptom combinations to medical conditions with specific remedies
 */

// Condition definitions with matching criteria
export const CONDITIONS = {
    muscle_strain: {
        id: 'muscle_strain',
        name: 'Muscle Strain',
        description: 'Overuse or injury to muscle fibers causing pain and stiffness',
        matchCriteria: {
            locations: ['back', 'lower back', 'upper back', 'neck', 'shoulder'],
            types: ['aching', 'sharp', 'throbbing'],
            triggers: ['lifting', 'movement', 'exercise', 'activity', 'bending', 'twisting', 'sitting'],
            frequency: ['constant', 'intermittent'],
            durationHint: 'acute' // less than 2-3 weeks
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Hot and Cold Therapy',
                description: 'Apply ice pack for first 48 hours (15 min intervals), then switch to heat therapy',
                ingredients: ['Ice pack or frozen peas', 'Hot water bag', 'Towel'],
                method: 'Ice: Wrap in towel, apply 15 mins, 4-6 times daily for first 2 days. Heat: Apply warm compress for 20 mins after 48 hours.',
                videoUrl: 'https://www.youtube.com/watch?v=6wdmhF_mzRE',
                videoTitle: 'Hot vs Cold Therapy for Muscle Pain'
            },
            {
                name: 'Epsom Salt Bath',
                description: 'Magnesium in Epsom salt helps relax tense muscles',
                ingredients: ['Epsom salt (2 cups)', 'Warm bath water'],
                method: 'Dissolve Epsom salt in warm bath. Soak affected area for 20-30 minutes.',
                videoUrl: 'https://www.youtube.com/watch?v=RK8SHBdEOVo',
                videoTitle: 'Epsom Salt Bath Benefits'
            },
            {
                name: 'Ginger Anti-inflammatory Tea',
                description: 'Ginger has natural anti-inflammatory properties',
                ingredients: ['Fresh ginger (1 inch)', 'Hot water', 'Honey', 'Lemon'],
                method: 'Grate ginger, steep in hot water for 10 mins. Add honey and lemon. Drink 2-3 times daily.',
                videoUrl: 'https://www.youtube.com/watch?v=dxQxJL2k5I0',
                videoTitle: 'Ginger Tea for Pain Relief'
            }
        ],
        exercises: [
            {
                name: 'Gentle Stretching',
                description: 'Light stretches to maintain mobility without straining',
                duration: '5-10 minutes',
                frequency: '2-3 times daily',
                videoUrl: 'https://www.youtube.com/watch?v=g_tea8ZNk5A',
                videoTitle: 'Gentle Stretches for Muscle Pain'
            },
            {
                name: 'Cat-Cow Stretch',
                description: 'Gentle spinal movement to relieve back tension',
                duration: '2 minutes, 10 reps',
                frequency: 'Morning and evening',
                videoUrl: 'https://www.youtube.com/watch?v=kqnua4rHVVA',
                videoTitle: 'Cat-Cow Stretch Tutorial'
            }
        ],
        warnings: ['Rest for 2-3 days if pain is severe', 'Avoid activities that worsen pain'],
        seekHelp: 'If pain persists beyond 2 weeks or worsens significantly'
    },

    tension_headache: {
        id: 'tension_headache',
        name: 'Tension Headache',
        description: 'Headache caused by muscle tension, often from stress or poor posture',
        matchCriteria: {
            locations: ['head', 'forehead', 'temples'],
            types: ['dull', 'aching', 'pressure'],
            triggers: ['stress', 'work', 'computer', 'screen', 'tension', 'lack of sleep', 'poor posture'],
            frequency: ['constant', 'intermittent', 'comes and goes'],
            intensity: [1, 2, 3, 4, 5, 6] // mild to moderate
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Peppermint Oil Temple Massage',
                description: 'Peppermint has cooling and pain-relieving properties',
                ingredients: ['Peppermint oil (2-3 drops)', 'Coconut oil (1 tsp)'],
                method: 'Mix oils. Gently massage on temples and back of neck in circular motions for 5 minutes.',
                videoUrl: 'https://www.youtube.com/watch?v=XHvCkVzKEzY',
                videoTitle: 'Headache Relief Massage'
            },
            {
                name: 'Cold Compress',
                description: 'Cold constricts blood vessels and reduces pain signals',
                ingredients: ['Cold pack or ice cubes', 'Cloth/towel'],
                method: 'Wrap cold pack in cloth. Apply to forehead or back of neck for 15-20 minutes.',
                videoUrl: 'https://www.youtube.com/watch?v=6wdmhF_mzRE',
                videoTitle: 'Cold Therapy for Headaches'
            },
            {
                name: 'Chamomile Tea',
                description: 'Chamomile has calming and anti-inflammatory effects',
                ingredients: ['Chamomile tea bag or dried flowers', 'Hot water', 'Honey'],
                method: 'Steep chamomile in hot water for 5-10 minutes. Add honey. Drink while relaxing in a quiet room.',
                videoUrl: 'https://www.youtube.com/watch?v=Bz1AJcTV8rU',
                videoTitle: 'Chamomile Tea Benefits'
            }
        ],
        exercises: [
            {
                name: 'Neck Stretches',
                description: 'Release tension in neck muscles that contribute to headaches',
                duration: '3-5 minutes',
                frequency: 'Every 2-3 hours when working',
                videoUrl: 'https://www.youtube.com/watch?v=wQylqaCl8Zo',
                videoTitle: 'Neck Stretches for Headache'
            },
            {
                name: 'Deep Breathing / Relaxation',
                description: 'Reduce stress and tension through controlled breathing',
                duration: '5-10 minutes',
                frequency: 'When headache starts',
                videoUrl: 'https://www.youtube.com/watch?v=tEmt1Znux58',
                videoTitle: 'Breathing for Headache Relief'
            },
            {
                name: '20-20-20 Eye Rule',
                description: 'Every 20 mins, look at something 20 feet away for 20 seconds',
                duration: '20 seconds',
                frequency: 'Every 20 minutes of screen time',
                videoUrl: 'https://www.youtube.com/watch?v=FkH-Gq5Qpwc',
                videoTitle: '20-20-20 Rule Explained'
            }
        ],
        warnings: ['Reduce screen time', 'Take breaks from work', 'Stay hydrated'],
        seekHelp: 'If headaches occur more than 15 days/month or are unusually severe'
    },

    migraine: {
        id: 'migraine',
        name: 'Migraine',
        description: 'Severe throbbing headache, often on one side, with sensitivity to light/sound',
        matchCriteria: {
            locations: ['head', 'one side of head'],
            types: ['throbbing', 'pulsating', 'sharp'],
            triggers: ['light', 'sound', 'stress', 'certain foods', 'hormones', 'weather'],
            frequency: ['comes and goes', 'episodic'],
            intensity: [6, 7, 8, 9, 10] // moderate to severe
        },
        severity: 'moderate-severe',
        remedies: [
            {
                name: 'Dark Quiet Room Rest',
                description: 'Minimize sensory input during migraine attack',
                ingredients: [],
                method: 'Lie down in a dark, quiet room. Close eyes. Apply cold compress to forehead.',
                videoUrl: 'https://www.youtube.com/watch?v=3khknaruqiE',
                videoTitle: 'Managing Migraine Attacks'
            },
            {
                name: 'Ginger Tea',
                description: 'Ginger can help with migraine-associated nausea and pain',
                ingredients: ['Fresh ginger', 'Hot water', 'Honey'],
                method: 'Grate 1 inch ginger, steep in hot water 10 mins. Drink slowly.',
                videoUrl: 'https://www.youtube.com/watch?v=dxQxJL2k5I0',
                videoTitle: 'Ginger for Migraines'
            },
            {
                name: 'Caffeine (small amount)',
                description: 'Small amount of caffeine can help some migraines if not used regularly',
                ingredients: ['Black coffee or strong tea (small cup)'],
                method: 'Drink a small cup at onset of migraine. Note: Only if you don\'t consume caffeine daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Avoid Exercise During Attack',
                description: 'Rest during active migraine - exercise can worsen symptoms',
                duration: 'N/A',
                frequency: 'During attack',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Preventive Yoga (between attacks)',
                description: 'Regular yoga may help prevent migraines',
                duration: '20-30 minutes',
                frequency: 'Daily when not having migraine',
                videoUrl: 'https://www.youtube.com/watch?v=v7AYKMP6rOE',
                videoTitle: 'Yoga for Migraine Prevention'
            }
        ],
        warnings: ['Avoid known triggers', 'Keep a headache diary', 'Stay in dark room during attack'],
        seekHelp: 'If migraines are new, severe, or affecting daily life significantly'
    },

    lower_back_pain_mechanical: {
        id: 'lower_back_pain_mechanical',
        name: 'Mechanical Lower Back Pain',
        description: 'Back pain from poor posture, prolonged sitting, or minor strain',
        matchCriteria: {
            locations: ['lower back', 'back'],
            types: ['aching', 'stiff', 'dull'],
            triggers: ['sitting', 'standing', 'posture', 'desk', 'driving', 'bending'],
            frequency: ['constant', 'intermittent'],
            durationHint: 'any'
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Warm Sesame Oil Massage',
                description: 'Traditional Ayurvedic remedy for back pain',
                ingredients: ['Sesame oil (3 tbsp)', 'Eucalyptus oil (few drops)'],
                method: 'Warm sesame oil, add eucalyptus. Massage on lower back for 15-20 mins. Rest with warm cloth.',
                videoUrl: 'https://www.youtube.com/watch?v=mRpbCQmPp9Q',
                videoTitle: 'Back Pain Oil Massage'
            },
            {
                name: 'Turmeric Golden Milk',
                description: 'Anti-inflammatory properties help reduce back pain',
                ingredients: ['Turmeric (1 tsp)', 'Warm milk', 'Black pepper (pinch)', 'Honey'],
                method: 'Add turmeric and pepper to warm milk. Drink before bed nightly.',
                videoUrl: 'https://www.youtube.com/watch?v=rJjZTYlm7Dk',
                videoTitle: 'Golden Milk Recipe'
            },
            {
                name: 'Fenugreek Seeds',
                description: 'Anti-inflammatory and pain-relieving properties',
                ingredients: ['Fenugreek seeds (1 tbsp)', 'Water'],
                method: 'Soak seeds overnight. Drink the water on empty stomach in morning.',
                videoUrl: 'https://www.youtube.com/watch?v=OKK6ysS0lEc',
                videoTitle: 'Fenugreek Water Benefits'
            }
        ],
        exercises: [
            {
                name: 'Cat-Cow Stretch',
                description: 'Improves spine flexibility and reduces stiffness',
                duration: '2-3 minutes',
                frequency: 'Morning and evening',
                videoUrl: 'https://www.youtube.com/watch?v=kqnua4rHVVA',
                videoTitle: 'Cat-Cow for Back Pain'
            },
            {
                name: 'Pelvic Tilts',
                description: 'Strengthens core and supports lower back',
                duration: '10 reps, hold 5 seconds each',
                frequency: 'Before getting out of bed',
                videoUrl: 'https://www.youtube.com/watch?v=3D7dSy_Mh0k',
                videoTitle: 'Pelvic Tilts Tutorial'
            },
            {
                name: 'Knee-to-Chest Stretch',
                description: 'Relieves tension in lower back muscles',
                duration: 'Hold 20 seconds each side',
                frequency: 'After long periods of sitting',
                videoUrl: 'https://www.youtube.com/watch?v=y5Hg2kMu3OU',
                videoTitle: 'Knee to Chest Stretch'
            }
        ],
        warnings: ['Improve sitting posture', 'Use lumbar support', 'Take walking breaks every 30-45 minutes'],
        seekHelp: 'If pain radiates to legs, causes numbness, or persists beyond 4-6 weeks'
    },

    sciatica: {
        id: 'sciatica',
        name: 'Possible Sciatica',
        description: 'Pain radiating from lower back down through the leg, often with numbness or tingling',
        matchCriteria: {
            locations: ['lower back', 'back', 'leg', 'hip'],
            types: ['shooting', 'burning', 'electric', 'sharp', 'radiating'],
            triggers: ['sitting', 'bending', 'lifting', 'coughing', 'sneezing'],
            specialSymptoms: ['numbness', 'tingling', 'pins and needles', 'weakness', 'down leg', 'radiates']
        },
        severity: 'moderate-severe',
        remedies: [
            {
                name: 'Cold Then Heat Therapy',
                description: 'Ice first, then heat after 48-72 hours',
                ingredients: ['Ice pack', 'Heating pad', 'Towel'],
                method: 'Ice for 20 mins, several times daily for first 3 days. Then switch to heat therapy.',
                videoUrl: 'https://www.youtube.com/watch?v=6wdmhF_mzRE',
                videoTitle: 'Hot vs Cold for Sciatica'
            },
            {
                name: 'Anti-inflammatory Diet',
                description: 'Reduce inflammation through diet',
                ingredients: ['Turmeric', 'Ginger', 'Omega-3 rich foods', 'Leafy greens'],
                method: 'Include these foods daily. Avoid processed foods and sugar.',
                videoUrl: 'https://www.youtube.com/watch?v=MtAEH8eHFHI',
                videoTitle: 'Anti-Inflammatory Diet'
            }
        ],
        exercises: [
            {
                name: 'Piriformis Stretch',
                description: 'Stretches the piriformis muscle which can compress sciatic nerve',
                duration: 'Hold 30 seconds each side',
                frequency: '3-4 times daily',
                videoUrl: 'https://www.youtube.com/watch?v=XJ-KkC9V4fU',
                videoTitle: 'Piriformis Stretch for Sciatica'
            },
            {
                name: 'Gentle Walking',
                description: 'Short walks to maintain mobility without straining',
                duration: '10-15 minutes',
                frequency: '2-3 times daily',
                videoUrl: 'https://www.youtube.com/watch?v=X3-gKPNyrTA',
                videoTitle: 'Walking for Sciatica'
            }
        ],
        warnings: [
            '⚠️ Sciatica often requires medical evaluation',
            'Avoid heavy lifting and twisting',
            'Don\'t stay in one position too long'
        ],
        seekHelp: 'STRONGLY RECOMMENDED: Consult a doctor for proper diagnosis. Seek immediate care if you have loss of bladder/bowel control or progressive weakness.'
    },

    neck_stiffness: {
        id: 'neck_stiffness',
        name: 'Neck Stiffness / Cervical Pain',
        description: 'Stiffness and pain in the neck, often from poor posture or sleeping position',
        matchCriteria: {
            locations: ['neck', 'upper back', 'shoulder'],
            types: ['stiff', 'aching', 'dull', 'tight'],
            triggers: ['sleeping', 'pillow', 'computer', 'phone', 'posture', 'looking down'],
            frequency: ['constant', 'morning']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Warm Mustard Oil Massage',
                description: 'Traditional remedy for neck stiffness',
                ingredients: ['Mustard oil (2 tbsp)', 'Garlic cloves (2-3, optional)'],
                method: 'Warm oil with garlic. Massage neck and shoulders in circular motions for 10-15 mins.',
                videoUrl: 'https://www.youtube.com/watch?v=3D7dSy_Mh0k',
                videoTitle: 'Neck Pain Massage'
            },
            {
                name: 'Ajwain (Carom Seeds) Potli',
                description: 'Heated herbal compress for pain relief',
                ingredients: ['Ajwain (2 tbsp)', 'Rock salt', 'Cotton cloth'],
                method: 'Roast ajwain with salt. Tie in cloth. Apply warm compress on neck.',
                videoUrl: 'https://www.youtube.com/watch?v=3oT_3qYkBsY',
                videoTitle: 'Ajwain Potli Remedy'
            }
        ],
        exercises: [
            {
                name: 'Neck Rotations',
                description: 'Gentle rotation to improve mobility',
                duration: '5 reps each direction',
                frequency: 'Every few hours',
                videoUrl: 'https://www.youtube.com/watch?v=wQylqaCl8Zo',
                videoTitle: 'Neck Stretches'
            },
            {
                name: 'Chin Tucks',
                description: 'Strengthens neck muscles and improves posture',
                duration: '10 reps, hold 5 seconds',
                frequency: 'While at computer',
                videoUrl: 'https://www.youtube.com/watch?v=wjXFl0PI8_w',
                videoTitle: 'Chin Tuck Exercise'
            },
            {
                name: 'Shoulder Shrugs',
                description: 'Releases tension in neck and shoulders',
                duration: '10 reps',
                frequency: 'When feeling tense',
                videoUrl: 'https://www.youtube.com/watch?v=s1J-a8i4bZU',
                videoTitle: 'Shoulder Shrugs'
            }
        ],
        warnings: ['Use thin, supportive pillow', 'Keep screen at eye level', 'Avoid looking down at phone'],
        seekHelp: 'If pain radiates to arms, causes numbness, or is accompanied by severe headache'
    },

    gastric_pain: {
        id: 'gastric_pain',
        name: 'Gastric Discomfort / Indigestion',
        description: 'Stomach pain, bloating, or burning sensation related to digestion',
        matchCriteria: {
            locations: ['abdomen', 'stomach', 'belly'],
            types: ['burning', 'cramping', 'bloating', 'dull'],
            triggers: ['eating', 'food', 'spicy', 'oily', 'stress', 'empty stomach', 'after meals'],
            frequency: ['after eating', 'intermittent']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Jeera (Cumin) Water',
                description: 'Aids digestion and reduces bloating',
                ingredients: ['Cumin seeds (1 tsp)', 'Water (2 cups)'],
                method: 'Boil cumin in water until reduced to half. Drink warm or at room temperature.',
                videoUrl: 'https://www.youtube.com/watch?v=3hQqIFrVv9s',
                videoTitle: 'Jeera Water Benefits'
            },
            {
                name: 'Hing (Asafoetida) Water',
                description: 'Relieves gas and bloating quickly',
                ingredients: ['Hing (pinch)', 'Warm water', 'Black salt'],
                method: 'Dissolve hing and black salt in warm water. Drink slowly when having gas.',
                videoUrl: 'https://www.youtube.com/watch?v=8JWkNv7GDIQ',
                videoTitle: 'Hing Water for Digestion'
            },
            {
                name: 'Fennel Seeds (Saunf)',
                description: 'Natural digestive aid',
                ingredients: ['Fennel seeds (1 tsp)'],
                method: 'Chew fennel seeds after meals or steep in hot water as tea.',
                videoUrl: 'https://www.youtube.com/watch?v=vZh5gkTJVqk',
                videoTitle: 'Fennel Tea Benefits'
            }
        ],
        exercises: [
            {
                name: 'Vajrasana (Thunderbolt Pose)',
                description: 'Sitting pose that aids digestion - only yoga pose done after eating',
                duration: '5-10 minutes after meals',
                frequency: 'After lunch and dinner',
                videoUrl: 'https://www.youtube.com/watch?v=6S_rnEJqFzE',
                videoTitle: 'Vajrasana for Digestion'
            },
            {
                name: 'Gentle Walking',
                description: 'Light walk to aid digestion',
                duration: '10-15 minutes',
                frequency: 'After meals',
                videoUrl: null,
                videoTitle: null
            }
        ],
        warnings: ['Eat slowly and chew properly', 'Avoid spicy and oily food', 'Don\'t lie down immediately after eating'],
        seekHelp: 'If pain is severe, recurring, or accompanied by vomiting blood or black stools'
    },

    general_body_pain: {
        id: 'general_body_pain',
        name: 'General Body Pain / Fatigue',
        description: 'Widespread body aches, often from fatigue, viral infection, or stress',
        matchCriteria: {
            locations: ['body', 'all over', 'multiple', 'general'],
            types: ['aching', 'tired', 'weak', 'sore'],
            triggers: ['work', 'stress', 'lack of sleep', 'flu', 'fever'],
            frequency: ['constant']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Turmeric Milk (Haldi Doodh)',
                description: 'Anti-inflammatory and immune-boosting',
                ingredients: ['Turmeric (1 tsp)', 'Warm milk', 'Black pepper (pinch)', 'Honey'],
                method: 'Mix turmeric and pepper in warm milk. Drink before bed.',
                videoUrl: 'https://www.youtube.com/watch?v=rJjZTYlm7Dk',
                videoTitle: 'Golden Milk Recipe'
            },
            {
                name: 'Adequate Rest',
                description: 'Rest is essential for recovery',
                ingredients: [],
                method: 'Get 7-8 hours of sleep. Take short rest breaks during day.',
                videoUrl: 'https://www.youtube.com/watch?v=t0kACis_dJE',
                videoTitle: 'Better Sleep Tips'
            },
            {
                name: 'Stay Hydrated',
                description: 'Dehydration can worsen body aches',
                ingredients: ['Warm water', 'Electrolyte drinks', 'Coconut water'],
                method: 'Drink 8-10 glasses of water daily. Prefer warm water.',
                videoUrl: 'https://www.youtube.com/watch?v=9iMGFqMmUFs',
                videoTitle: 'Hydration Tips'
            }
        ],
        exercises: [
            {
                name: 'Gentle Stretching',
                description: 'Light stretches if feeling up to it',
                duration: '5-10 minutes',
                frequency: 'If energy permits',
                videoUrl: 'https://www.youtube.com/watch?v=g_tea8ZNk5A',
                videoTitle: 'Gentle Full Body Stretch'
            },
            {
                name: 'Deep Breathing',
                description: 'Helps with relaxation and recovery',
                duration: '5 minutes',
                frequency: 'Several times daily',
                videoUrl: 'https://www.youtube.com/watch?v=acUZdGd_3Dg',
                videoTitle: 'Deep Breathing Exercise'
            }
        ],
        warnings: ['Check temperature for fever', 'Rest more if fatigued', 'Eat light, nutritious food'],
        seekHelp: 'If accompanied by high fever, severe symptoms, or persists beyond a week'
    }
};

/**
 * Diagnose condition based on pain data
 * Returns array of possible conditions with confidence scores
 */
export function diagnoseCondition(painData) {
    const results = [];

    const location = Array.isArray(painData.location)
        ? painData.location.join(' ').toLowerCase()
        : (painData.location || '').toLowerCase();

    const painType = (painData.type?.label || painData.type || '').toLowerCase();
    const triggers = (painData.triggers || '').toLowerCase();
    const duration = (painData.duration || '').toLowerCase();
    const frequency = (painData.frequency?.title || '').toLowerCase();
    const intensity = painData.intensity?.value || 0;

    // Combine all text for keyword matching
    const allText = `${location} ${painType} ${triggers} ${duration} ${frequency}`.toLowerCase();

    for (const [conditionId, condition] of Object.entries(CONDITIONS)) {
        let score = 0;
        let maxScore = 0;

        const criteria = condition.matchCriteria;

        // Check location match (weight: 3)
        if (criteria.locations) {
            maxScore += 3;
            const locationMatch = criteria.locations.some(loc =>
                location.includes(loc.toLowerCase())
            );
            if (locationMatch) score += 3;
        }

        // Check pain type match (weight: 2)
        if (criteria.types) {
            maxScore += 2;
            const typeMatch = criteria.types.some(type =>
                painType.includes(type.toLowerCase())
            );
            if (typeMatch) score += 2;
        }

        // Check triggers match (weight: 2)
        if (criteria.triggers) {
            maxScore += 2;
            const triggerMatch = criteria.triggers.some(trigger =>
                triggers.includes(trigger.toLowerCase()) || allText.includes(trigger.toLowerCase())
            );
            if (triggerMatch) score += 2;
        }

        // Check frequency match (weight: 1)
        if (criteria.frequency) {
            maxScore += 1;
            const freqMatch = criteria.frequency.some(freq =>
                frequency.includes(freq.toLowerCase())
            );
            if (freqMatch) score += 1;
        }

        // Check special symptoms for sciatica etc. (weight: 3)
        if (criteria.specialSymptoms) {
            maxScore += 3;
            const specialMatch = criteria.specialSymptoms.some(symptom =>
                allText.includes(symptom.toLowerCase())
            );
            if (specialMatch) score += 3;
        }

        // Check intensity match (weight: 1)
        if (criteria.intensity) {
            maxScore += 1;
            if (criteria.intensity.includes(intensity)) score += 1;
        }

        // Check duration hint
        if (criteria.durationHint) {
            if (criteria.durationHint === 'acute' &&
                (duration.includes('day') || duration.includes('week') ||
                    duration.includes('recent') || duration.includes('few'))) {
                score += 0.5;
            }
            if (criteria.durationHint === 'chronic' &&
                (duration.includes('month') || duration.includes('year') ||
                    duration.includes('long'))) {
                score += 0.5;
            }
        }

        const confidence = maxScore > 0 ? (score / maxScore) * 100 : 0;

        if (confidence >= 30) { // Minimum 30% match threshold
            results.push({
                condition: condition,
                score: score,
                confidence: Math.round(confidence),
                conditionId: conditionId
            });
        }
    }

    // Sort by confidence (highest first)
    results.sort((a, b) => b.confidence - a.confidence);

    // Return top 2 conditions if they have reasonable confidence
    return results.slice(0, 2);
}

/**
 * Get fallback recommendations if no condition matches
 */
export function getGeneralRecommendations(location) {
    const loc = (location || '').toLowerCase();

    // Return general body pain recommendations as fallback
    return {
        condition: CONDITIONS.general_body_pain,
        confidence: 50,
        conditionId: 'general_body_pain',
        isFallback: true
    };
}

export default CONDITIONS;

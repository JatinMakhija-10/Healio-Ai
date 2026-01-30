/**
 * Health Risk Calculator
 * Performs hidden calculations based on user onboarding data to assess health risks
 */

export interface BMIResult {
    value: number;
    category: 'underweight' | 'normal' | 'overweight' | 'obese_class_1' | 'obese_class_2' | 'obese_class_3';
    interpretation: string;
    ayurvedicInsight: string;
}

export interface RiskScore {
    score: number; // 0-100
    level: 'low' | 'moderate' | 'high' | 'very_high';
    factors: string[];
    recommendations: string[];
}

export interface LifestyleScore {
    score: number; // 0-100
    rating: 'excellent' | 'good' | 'fair' | 'needs_improvement' | 'poor';
    breakdown: {
        exercise: number;
        diet: number;
        sleep: number;
        habits: number;
    };
    ayurvedicBalance: string;
}

export interface HealthRiskProfile {
    bmi: BMIResult;
    cardiovascularRisk: RiskScore;
    diabetesRisk: RiskScore;
    respiratoryRisk: RiskScore;
    liverRisk: RiskScore;
    lifestyleScore: LifestyleScore;
    overallHealthScore: number;
    priorityWarnings: string[];
}

export interface OnboardingData {
    age?: string;
    gender?: string;
    weight?: string;
    height?: string;
    smoking?: string;
    alcohol?: string;
    exercise?: string;
    diet?: string;
    sleepHours?: string;
    conditions?: string[];
    familyHistory?: string[];
    bloodPressure?: string;
    medications?: string;
    recentSurgery?: boolean;
    isPregnant?: boolean;
    hasKidneyLiverDisease?: boolean;
}

/**
 * Calculate BMI and categorize according to WHO standards
 * Also provides Ayurvedic interpretation
 */
export function calculateBMI(heightCm: number, weightKg: number): BMIResult {
    if (heightCm <= 0 || weightKg <= 0) {
        return {
            value: 0,
            category: 'normal',
            interpretation: 'Unable to calculate - invalid data',
            ayurvedicInsight: 'Please provide valid height and weight'
        };
    }

    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    const roundedBMI = Math.round(bmi * 10) / 10;

    let category: BMIResult['category'];
    let interpretation: string;
    let ayurvedicInsight: string;

    if (bmi < 18.5) {
        category = 'underweight';
        interpretation = 'Below healthy weight range. May indicate nutritional deficiency or underlying health issues.';
        ayurvedicInsight = 'Suggests Vata dominance or imbalance. Focus on grounding, nourishing foods. Warm, oily foods like ghee, milk, and root vegetables are beneficial.';
    } else if (bmi < 25) {
        category = 'normal';
        interpretation = 'Healthy weight range. Maintain current lifestyle with balanced nutrition and exercise.';
        ayurvedicInsight = 'Indicates balanced Agni (digestive fire) and good tissue nourishment. Continue balanced Sattvic diet.';
    } else if (bmi < 30) {
        category = 'overweight';
        interpretation = 'Above healthy weight range. Increased risk of metabolic conditions.';
        ayurvedicInsight = 'May indicate Kapha accumulation or Meda Dhatu (fat tissue) imbalance. Favor light, warm, spiced foods. Reduce sweet, oily, cold foods.';
    } else if (bmi < 35) {
        category = 'obese_class_1';
        interpretation = 'Obesity Class I. Significant health risk increase. Medical consultation recommended.';
        ayurvedicInsight = 'Indicates Kapha imbalance with Ama (toxin) accumulation. Trikatu, Triphala, and Guggulu may help. Avoid daytime sleep and heavy foods.';
    } else if (bmi < 40) {
        category = 'obese_class_2';
        interpretation = 'Obesity Class II. High health risk. Medical intervention advised.';
        ayurvedicInsight = 'Severe Kapha-Ama condition. Panchakarma (detoxification) therapy may be beneficial under guidance. Strict diet and lifestyle changes needed.';
    } else {
        category = 'obese_class_3';
        interpretation = 'Obesity Class III. Very high health risk. Urgent medical attention needed.';
        ayurvedicInsight = 'Indicates chronic Kapha-Ama with compromised Agni. Professional Ayurvedic and medical intervention strongly recommended.';
    }

    return {
        value: roundedBMI,
        category,
        interpretation,
        ayurvedicInsight
    };
}

/**
 * Calculate Cardiovascular Risk Score
 * Based on Framingham-like risk factors adapted for general assessment
 */
export function calculateCardiovascularRisk(data: OnboardingData, bmi: BMIResult): RiskScore {
    let score = 0;
    const factors: string[] = [];
    const recommendations: string[] = [];

    const age = parseInt(data.age || '0');
    const isMale = data.gender === 'male';

    // Age factor (older = higher risk)
    if (age >= 65) {
        score += 25;
        factors.push('Age 65+ years');
    } else if (age >= 55) {
        score += 18;
        factors.push('Age 55-64 years');
    } else if (age >= 45) {
        score += 12;
        factors.push('Age 45-54 years');
    } else if (age >= 35) {
        score += 6;
    }

    // Gender (males have higher baseline risk)
    if (isMale) {
        score += 8;
    }

    // BMI factor
    if (bmi.category === 'obese_class_3') {
        score += 20;
        factors.push('Severe obesity');
        recommendations.push('Weight management is critical - consider consulting a dietary specialist');
    } else if (bmi.category === 'obese_class_2' || bmi.category === 'obese_class_1') {
        score += 15;
        factors.push('Obesity');
        recommendations.push('Gradual weight reduction through diet and exercise');
    } else if (bmi.category === 'overweight') {
        score += 8;
        factors.push('Overweight');
        recommendations.push('Lifestyle modifications to achieve healthy weight');
    }

    // Smoking factor
    if (data.smoking === 'current') {
        score += 25;
        factors.push('Current smoker');
        recommendations.push('Smoking cessation is the single most impactful change');
        recommendations.push('Ayurvedic: Tulsi, Pippali, and deep breathing exercises can support lung health');
    } else if (data.smoking === 'former') {
        score += 10;
        factors.push('Former smoker');
    }

    // Exercise factor (protective)
    if (data.exercise === 'sedentary') {
        score += 15;
        factors.push('Sedentary lifestyle');
        recommendations.push('Start with 20-30 minutes of walking daily');
        recommendations.push('Ayurvedic: Surya Namaskar (Sun Salutations) are excellent for heart health');
    } else if (data.exercise === 'light') {
        score += 8;
        factors.push('Low physical activity');
        recommendations.push('Increase activity frequency to 4-5 times per week');
    } else if (data.exercise === 'active') {
        score -= 10; // Protective factor
    }

    // Blood pressure
    if (data.bloodPressure === 'high') {
        score += 20;
        factors.push('High blood pressure');
        recommendations.push('Regular BP monitoring essential');
        recommendations.push('Ayurvedic: Arjuna bark tea, Ashwagandha, and reducing salt intake');
    }

    // Family history
    if (data.familyHistory?.includes('Heart Disease')) {
        score += 15;
        factors.push('Family history of heart disease');
        recommendations.push('Regular cardiovascular screening recommended');
    }
    if (data.familyHistory?.includes('Hypertension')) {
        score += 8;
        factors.push('Family history of hypertension');
    }
    if (data.familyHistory?.includes('Stroke')) {
        score += 12;
        factors.push('Family history of stroke');
    }

    // Existing conditions
    if (data.conditions?.includes('Diabetes')) {
        score += 15;
        factors.push('Existing diabetes');
    }
    if (data.conditions?.includes('Hypertension')) {
        score += 15;
        factors.push('Existing hypertension');
    }

    // Diet factor
    if (data.diet === 'non-veg') {
        score += 5; // Slightly higher risk with heavy non-veg diet
    } else if (data.diet === 'vegetarian' || data.diet === 'vegan') {
        score -= 5; // Protective factor
    }

    // Alcohol factor
    if (data.alcohol === 'frequent') {
        score += 10;
        factors.push('Frequent alcohol consumption');
        recommendations.push('Reduce alcohol to occasional or none');
    }

    // Normalize score to 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine risk level
    let level: RiskScore['level'];
    if (score < 20) level = 'low';
    else if (score < 40) level = 'moderate';
    else if (score < 60) level = 'high';
    else level = 'very_high';

    // Add general recommendations based on risk level
    if (level === 'high' || level === 'very_high') {
        recommendations.push('Consider cardiac health check-up');
        recommendations.push('Ayurvedic: Regular Abhyanga (oil massage) improves circulation');
    }

    return { score, level, factors, recommendations };
}

/**
 * Calculate Diabetes Risk Score
 * Based on Finnish Diabetes Risk Score (FINDRISC) adapted
 */
export function calculateDiabetesRisk(data: OnboardingData, bmi: BMIResult): RiskScore {
    let score = 0;
    const factors: string[] = [];
    const recommendations: string[] = [];

    const age = parseInt(data.age || '0');

    // Age factor
    if (age >= 64) {
        score += 20;
        factors.push('Age 64+ years');
    } else if (age >= 55) {
        score += 15;
        factors.push('Age 55-63 years');
    } else if (age >= 45) {
        score += 10;
        factors.push('Age 45-54 years');
    }

    // BMI factor
    if (bmi.value >= 30) {
        score += 25;
        factors.push('BMI ≥ 30 (Obesity)');
        recommendations.push('Weight reduction of even 5-7% significantly reduces diabetes risk');
    } else if (bmi.value >= 25) {
        score += 12;
        factors.push('BMI 25-30 (Overweight)');
    }

    // Family history
    if (data.familyHistory?.includes('Diabetes')) {
        score += 20;
        factors.push('Family history of diabetes');
        recommendations.push('Monitor blood sugar levels annually');
        recommendations.push('Ayurvedic: Bitter gourd (Karela), Fenugreek (Methi), and Jamun seeds help regulate blood sugar');
    }

    // Exercise
    if (data.exercise === 'sedentary') {
        score += 15;
        factors.push('No physical activity');
        recommendations.push('30 minutes of moderate exercise daily helps prevent diabetes');
    } else if (data.exercise === 'light') {
        score += 8;
    } else if (data.exercise === 'active') {
        score -= 10; // Protective
    }

    // Diet
    if (data.diet === 'non-veg' || data.diet === 'mixed') {
        score += 5;
    }
    if (data.diet === 'vegetarian') {
        score -= 5; // Slightly protective
        recommendations.push('Vegetarian diet is beneficial - maintain balance of protein sources');
    }

    // Existing conditions
    if (data.conditions?.includes('Thyroid')) {
        score += 8;
        factors.push('Thyroid condition');
    }

    // Blood pressure
    if (data.bloodPressure === 'high') {
        score += 10;
        factors.push('High blood pressure (metabolic syndrome indicator)');
    }

    // Sleep
    if (data.sleepHours === '<5' || data.sleepHours === '5-6') {
        score += 10;
        factors.push('Insufficient sleep');
        recommendations.push('Poor sleep quality increases diabetes risk - aim for 7-8 hours');
        recommendations.push('Ayurvedic: Take Ashwagandha with warm milk before bed');
    }

    // Normalize
    score = Math.max(0, Math.min(100, score));

    let level: RiskScore['level'];
    if (score < 20) level = 'low';
    else if (score < 40) level = 'moderate';
    else if (score < 60) level = 'high';
    else level = 'very_high';

    if (level !== 'low') {
        recommendations.push('Ayurvedic: Include Triphala, Turmeric, and Cinnamon in diet regularly');
        recommendations.push('Reduce refined carbohydrates and sugar intake');
    }

    return { score, level, factors, recommendations };
}

/**
 * Calculate Respiratory Risk Score
 * Primarily based on smoking and age
 */
export function calculateRespiratoryRisk(data: OnboardingData): RiskScore {
    let score = 0;
    const factors: string[] = [];
    const recommendations: string[] = [];

    const age = parseInt(data.age || '0');

    // Smoking is the primary factor
    if (data.smoking === 'current') {
        score += 50;
        factors.push('Current smoker');
        recommendations.push('Smoking is the leading cause of respiratory disease - quitting is essential');
        recommendations.push('Ayurvedic: Vasaka (Adhatoda), Tulsi, and Pippali support lung health');
        recommendations.push('Practice Pranayama (breathing exercises) daily - start with Anulom Vilom');
    } else if (data.smoking === 'former') {
        score += 20;
        factors.push('Former smoker');
        recommendations.push('Lung function improves after quitting - continue smoke-free');
        recommendations.push('Ayurvedic: Chyawanprash daily helps rejuvenate lung tissue');
    }

    // Age factor for smokers
    if (data.smoking === 'current' || data.smoking === 'former') {
        if (age >= 55) {
            score += 20;
            factors.push('Age-related risk increase (smoking history)');
        } else if (age >= 40) {
            score += 10;
        }
    }

    // Existing conditions
    if (data.conditions?.includes('Asthma')) {
        score += 25;
        factors.push('Existing asthma');
        recommendations.push('Ayurvedic: Sitopaladi churna with honey helps manage respiratory issues');
    }

    // Exercise (protective)
    if (data.exercise === 'active' || data.exercise === 'moderate') {
        score -= 10;
        recommendations.push('Continue regular exercise - it strengthens lung capacity');
    }

    // Environmental factors (occupation-based proxy)
    // This is limited without detailed occupation data

    // Normalize
    score = Math.max(0, Math.min(100, score));

    let level: RiskScore['level'];
    if (score < 15) level = 'low';
    else if (score < 35) level = 'moderate';
    else if (score < 55) level = 'high';
    else level = 'very_high';

    if (level === 'low' && data.smoking === 'never') {
        recommendations.push('Excellent! Continue smoke-free lifestyle');
        recommendations.push('Ayurvedic: Pranayama practice enhances respiratory wellness');
    }

    return { score, level, factors, recommendations };
}

/**
 * Calculate Liver Risk Score
 * Based on alcohol consumption and other factors
 */
export function calculateLiverRisk(data: OnboardingData, bmi: BMIResult): RiskScore {
    let score = 0;
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Alcohol is the primary factor
    if (data.alcohol === 'frequent') {
        score += 45;
        factors.push('Frequent alcohol consumption');
        recommendations.push('Heavy alcohol use is the leading cause of liver disease');
        recommendations.push('Ayurvedic: Kutki, Bhringraj, and Punarnava support liver regeneration');
        recommendations.push('Consider taking Liv.52 or similar Ayurvedic liver support');
    } else if (data.alcohol === 'occasional') {
        score += 15;
        factors.push('Occasional alcohol use');
        recommendations.push('Moderate alcohol intake - liver enzymes should be monitored annually');
    }

    // Obesity (Non-alcoholic fatty liver)
    if (bmi.category === 'obese_class_2' || bmi.category === 'obese_class_3') {
        score += 25;
        factors.push('Obesity increases fatty liver risk');
        recommendations.push('Weight loss is crucial for preventing fatty liver disease');
    } else if (bmi.category === 'obese_class_1' || bmi.category === 'overweight') {
        score += 15;
        factors.push('Overweight (fatty liver risk)');
    }

    // Existing conditions
    if (data.hasKidneyLiverDisease) {
        score += 30;
        factors.push('Pre-existing kidney/liver condition');
        recommendations.push('Regular monitoring under medical supervision essential');
    }

    if (data.conditions?.includes('Diabetes')) {
        score += 15;
        factors.push('Diabetes (metabolic liver stress)');
    }

    // Medications (hepatotoxic potential)
    if (data.medications && data.medications.length > 0) {
        score += 5;
        factors.push('Medication use (monitor liver function)');
        recommendations.push('Ensure periodic liver function tests if on long-term medications');
    }

    // Diet
    if (data.diet === 'non-veg') {
        score += 5; // Slightly higher risk with heavy meat diet
    }

    // Normalize
    score = Math.max(0, Math.min(100, score));

    let level: RiskScore['level'];
    if (score < 15) level = 'low';
    else if (score < 35) level = 'moderate';
    else if (score < 55) level = 'high';
    else level = 'very_high';

    if (level === 'low' && data.alcohol === 'none') {
        recommendations.push('Excellent liver health indicators!');
        recommendations.push('Ayurvedic: Aloe vera juice and Amla support ongoing liver wellness');
    }

    return { score, level, factors, recommendations };
}

/**
 * Calculate Overall Lifestyle Score
 * Holistic assessment of lifestyle factors
 */
export function calculateLifestyleScore(data: OnboardingData): LifestyleScore {
    let exerciseScore = 0;
    let dietScore = 0;
    let sleepScore = 0;
    let habitsScore = 0;

    // Exercise component (0-25)
    switch (data.exercise) {
        case 'active':
            exerciseScore = 25;
            break;
        case 'moderate':
            exerciseScore = 20;
            break;
        case 'light':
            exerciseScore = 12;
            break;
        case 'sedentary':
        default:
            exerciseScore = 5;
    }

    // Diet component (0-25)
    switch (data.diet) {
        case 'vegetarian':
            dietScore = 25;
            break;
        case 'vegan':
            dietScore = 23;
            break;
        case 'mixed':
            dietScore = 18;
            break;
        case 'non-veg':
        default:
            dietScore = 12;
    }

    // Sleep component (0-25)
    switch (data.sleepHours) {
        case '7-8':
            sleepScore = 25;
            break;
        case '8+':
            sleepScore = 22; // Slightly less optimal than 7-8
            break;
        case '6-7':
            sleepScore = 18;
            break;
        case '5-6':
            sleepScore = 10;
            break;
        case '<5':
        default:
            sleepScore = 5;
    }

    // Habits component (smoking & alcohol) (0-25)
    let smokingPenalty = 0;
    let alcoholPenalty = 0;

    if (data.smoking === 'current') smokingPenalty = 15;
    else if (data.smoking === 'former') smokingPenalty = 5;

    if (data.alcohol === 'frequent') alcoholPenalty = 10;
    else if (data.alcohol === 'occasional') alcoholPenalty = 3;

    habitsScore = Math.max(0, 25 - smokingPenalty - alcoholPenalty);

    const totalScore = exerciseScore + dietScore + sleepScore + habitsScore;

    let rating: LifestyleScore['rating'];
    if (totalScore >= 85) rating = 'excellent';
    else if (totalScore >= 70) rating = 'good';
    else if (totalScore >= 55) rating = 'fair';
    else if (totalScore >= 40) rating = 'needs_improvement';
    else rating = 'poor';

    // Determine Ayurvedic balance interpretation
    let ayurvedicBalance: string;
    if (totalScore >= 85) {
        ayurvedicBalance = 'Sattva dominant - balanced lifestyle promotes clarity, peace, and optimal Agni (digestive fire).';
    } else if (totalScore >= 70) {
        ayurvedicBalance = 'Good Sattvic tendencies with some Rajasic qualities. Minor adjustments can optimize wellbeing.';
    } else if (totalScore >= 55) {
        ayurvedicBalance = 'Rajas-Tamas influence present. Lifestyle creates mild Ama (toxin) accumulation. Focus on routine and moderation.';
    } else if (totalScore >= 40) {
        ayurvedicBalance = 'Tamas influence increasing. Lifestyle may cause doshic imbalances and Ama buildup. Significant changes recommended.';
    } else {
        ayurvedicBalance = 'Tamas dominant lifestyle. High Ama accumulation likely. Complete lifestyle overhaul needed for health restoration.';
    }

    return {
        score: totalScore,
        rating,
        breakdown: {
            exercise: exerciseScore,
            diet: dietScore,
            sleep: sleepScore,
            habits: habitsScore
        },
        ayurvedicBalance
    };
}

/**
 * Calculate Complete Health Risk Profile
 * Master function that computes all health metrics
 */
export function calculateHealthRiskProfile(data: OnboardingData): HealthRiskProfile {
    const heightCm = parseFloat(data.height || '0');
    const weightKg = parseFloat(data.weight || '0');

    const bmi = calculateBMI(heightCm, weightKg);
    const cardiovascularRisk = calculateCardiovascularRisk(data, bmi);
    const diabetesRisk = calculateDiabetesRisk(data, bmi);
    const respiratoryRisk = calculateRespiratoryRisk(data);
    const liverRisk = calculateLiverRisk(data, bmi);
    const lifestyleScore = calculateLifestyleScore(data);

    // Calculate overall health score (weighted average)
    const overallHealthScore = Math.round(
        (lifestyleScore.score * 0.4) +
        ((100 - cardiovascularRisk.score) * 0.2) +
        ((100 - diabetesRisk.score) * 0.15) +
        ((100 - respiratoryRisk.score) * 0.15) +
        ((100 - liverRisk.score) * 0.1)
    );

    // Generate priority warnings
    const priorityWarnings: string[] = [];

    if (cardiovascularRisk.level === 'very_high' || cardiovascularRisk.level === 'high') {
        priorityWarnings.push('⚠️ Elevated cardiovascular risk - lifestyle modifications strongly recommended');
    }
    if (diabetesRisk.level === 'very_high' || diabetesRisk.level === 'high') {
        priorityWarnings.push('⚠️ Elevated diabetes risk - blood sugar monitoring advised');
    }
    if (respiratoryRisk.level === 'very_high' || respiratoryRisk.level === 'high') {
        priorityWarnings.push('⚠️ Respiratory health concern - smoking cessation and lung care essential');
    }
    if (liverRisk.level === 'very_high' || liverRisk.level === 'high') {
        priorityWarnings.push('⚠️ Liver health concern - alcohol reduction and regular check-ups needed');
    }
    if (bmi.category !== 'normal' && bmi.category !== 'underweight') {
        priorityWarnings.push(`📊 BMI: ${bmi.value} (${bmi.category.replace('_', ' ')}) - weight management may benefit health`);
    }

    return {
        bmi,
        cardiovascularRisk,
        diabetesRisk,
        respiratoryRisk,
        liverRisk,
        lifestyleScore,
        overallHealthScore,
        priorityWarnings
    };
}

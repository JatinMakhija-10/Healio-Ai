import { Condition } from "./types";
import { musculoskeletalConditions } from "./conditions/musculoskeletal";
import { respiratoryConditions } from "./conditions/respiratory";
import { digestiveConditions } from "./conditions/digestive";
import { generalConditions } from "./conditions/general";
import { skinConditions } from "./conditions/skin";
import { dentalConditions } from "./conditions/dental";
import { entConditions } from "./conditions/ent";
import { eyeConditions } from "./conditions/eyes";
import { mentalConditions } from "./conditions/mental";
import { injuryConditions } from "./conditions/injuries";
import { ayurvedaConditions } from "./conditions/ayurveda";
import { COMMON_CONDITIONS } from "./conditions/common";
import { neurologicalConditions } from "./conditions/neurological";
import { urogenitalConditions } from "./conditions/urogenital";
import { cardiovascularConditions } from "./conditions/cardiovascular";
import { infectiousConditions } from "./conditions/infectious";
import { metabolicConditions } from "./conditions/metabolic";

import { skinExtendedConditions } from "./conditions/skin_extended";

export const CONDITIONS: Record<string, Condition> = {
    ...COMMON_CONDITIONS,  // Priority: common conditions first
    ...musculoskeletalConditions,
    ...infectiousConditions,
    ...respiratoryConditions,
    ...digestiveConditions,
    ...generalConditions,
    ...metabolicConditions,
    ...skinConditions,
    ...skinExtendedConditions,
    ...dentalConditions,
    ...entConditions,
    ...eyeConditions,
    ...mentalConditions,
    ...injuryConditions,
    ...ayurvedaConditions,
    ...neurologicalConditions,
    ...urogenitalConditions,
    ...cardiovascularConditions
};

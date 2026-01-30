/**
 * Care Pathways Supabase Client
 * 
 * Fetches care pathways from Supabase database
 */

import { supabase } from '../supabase';
import { CarePathway } from './care-pathways/types';

/**
 * Fetch a care pathway by condition ID
 * @param conditionId The condition identifier
 * @returns Care pathway or null if not found
 */
export async function fetchPathwayForCondition(
    conditionId: string
): Promise<CarePathway | null> {
    try {
        const { data, error } = await supabase
            .from('care_pathways')
            .select('pathway_data')
            .eq('id', conditionId)
            .single();

        if (error) {
            console.error(`Error fetching pathway for ${conditionId}:`, error);
            return null;
        }

        return data?.pathway_data as CarePathway || null;
    } catch (err) {
        console.error(`Exception fetching pathway for ${conditionId}:`, err);
        return null;
    }
}

/**
 * Fetch multiple pathways by condition IDs
 * @param conditionIds Array of condition identifiers
 * @returns Map of condition ID to pathway
 */
export async function fetchPathwaysForConditions(
    conditionIds: string[]
): Promise<Map<string, CarePathway>> {
    const pathwayMap = new Map<string, CarePathway>();

    if (conditionIds.length === 0) return pathwayMap;

    try {
        const { data, error } = await supabase
            .from('care_pathways')
            .select('id, pathway_data')
            .in('id', conditionIds);

        if (error) {
            console.error('Error fetching multiple pathways:', error);
            return pathwayMap;
        }

        if (data) {
            for (const row of data) {
                pathwayMap.set(row.id, row.pathway_data as CarePathway);
            }
        }

        return pathwayMap;
    } catch (err) {
        console.error('Exception fetching multiple pathways:', err);
        return pathwayMap;
    }
}

/**
 * Fetch all pathways for a given urgency level
 * @param urgency Urgency level (emergency, urgent, routine, self-care)
 * @returns Array of care pathways
 */
export async function fetchPathwaysByUrgency(
    urgency: 'emergency' | 'urgent' | 'routine' | 'self-care'
): Promise<CarePathway[]> {
    try {
        const { data, error } = await supabase
            .from('care_pathways')
            .select('pathway_data')
            .eq('urgency', urgency);

        if (error) {
            console.error(`Error fetching pathways for urgency ${urgency}:`, error);
            return [];
        }

        return (data || []).map(row => row.pathway_data as CarePathway);
    } catch (err) {
        console.error(`Exception fetching pathways for urgency ${urgency}:`, err);
        return [];
    }
}

/**
 * Fetch all Tier 1 (must-have) pathways
 * @returns Array of Tier 1 care pathways
 */
export async function fetchTier1Pathways(): Promise<CarePathway[]> {
    try {
        const { data, error } = await supabase
            .from('care_pathways')
            .select('pathway_data')
            .eq('tier', 1);

        if (error) {
            console.error('Error fetching Tier 1 pathways:', error);
            return [];
        }

        return (data || []).map(row => row.pathway_data as CarePathway);
    } catch (err) {
        console.error('Exception fetching Tier 1 pathways:', err);
        return [];
    }
}

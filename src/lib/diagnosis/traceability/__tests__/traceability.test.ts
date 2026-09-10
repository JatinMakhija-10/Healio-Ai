import { describe, it, expect } from "vitest";
import { buildEvidenceGraph } from "../EvidenceGraphBuilder";
import type { BuilderInput } from "../EvidenceGraphBuilder";

describe("EvidenceGraphBuilder", () => {
    const mockInput: BuilderInput = {
        symptoms: {
            locations: ["head", "temples"],
            painType: "throbbing",
            triggers: "bright light",
            duration: "2 days",
            additionalNotes: "Nausea and light sensitivity",
            sanitizedSymptomText: "head temples throbbing bright light 2 days Nausea and light sensitivity",
        },
        bayesian: {
            conditionId: "migraine_headache",
            conditionName: "Migraine",
            bayesianScore: 88,
            matchedKeywords: ["throbbing", "light sensitivity", "nausea"],
            clinicalRuleAlerts: [],
            posteriorRedFlags: [],
            mcmcDiagnostics: {
                rHat: 1.002,
                effectiveSampleSize: 850,
                converged: true,
                credibleInterval: { lower: 82, upper: 94, width: 12 },
                acceptanceRate: 0.35,
                posteriorPredictiveP: 0.88,
            },
        },
        boerickeChunks: [
            {
                remedy_name: "Belladonna",
                chunk_text: "Throbbing headache, worse from light and noise. Pupils dilated, flushed face.",
                similarity: 0.84,
            },
            {
                remedy_name: "Gelsemium",
                chunk_text: "Dull, heavy headache with dizziness and heaviness of eyelids.",
                similarity: 0.72,
            },
        ],
        ayurvedicChunks: [
            {
                book: "Charaka Samhita",
                category: "Sutrasthana",
                section: "Chapter 17 - Shiroroga",
                text: "Pitta and Vata vitiation in the head causes intense pulsating shiroshoola, alleviated by cooling applications.",
                similarity: 0.79,
            },
            {
                book: "Astanga Hridaya",
                category: "Uttaratantra",
                section: "Chapter 23 - Shiroroga Pratishedha",
                text: "Ardhavabhedaka (hemicrania/migraine) treatments involving Nasya with Anu Taila and cold milk compresses.",
                similarity: 0.75,
            },
        ],
        pdfChunks: [
            {
                source_file: "indian-medicinal-plants.pdf",
                page_number: 142,
                chunk_text: "Zingiber officinale (Ginger) paste applied to forehead relieves vascular headache.",
                similarity: 0.68,
            },
        ],
        homeRemedyChunks: [
            {
                ailment: "Headache",
                ailment_hindi: "सरदर्द",
                remedy_name: "Ginger Tea with Holy Basil",
                remedy_name_hindi: "अदरक तुलसी चाय",
                chunk_text: "Boil crushed ginger root and 5 tulsi leaves in water. Drink warm twice daily.",
                similarity: 0.82,
            },
        ],
        aiRemedies: [
            {
                name: "Belladonna 30C",
                potency: "30C",
                dosage: "4 pills 3 times daily",
                indication: "Throbbing headache with light sensitivity",
                source: "boericke",
            },
        ],
        aiHomeRemedies: [
            {
                name: "Ginger Herbal Infusion",
                preparation: "Steep freshly grated ginger in warm water for 10 minutes",
                rationale: "Ginger contains gingerols that suppress prostaglandin synthesis",
            },
        ],
        provider: "groq",
        latencyMs: 1250,
        cacheHit: false,
        activeProviders: ["jina", "gemini"],
        totalQueries: 3,
    };

    it("constructs a valid EvidenceTraceabilityGraph with all top-level nodes", () => {
        const graph = buildEvidenceGraph(mockInput);

        expect(graph).toBeDefined();
        expect(graph.version).toBe("1.0");
        expect(graph.generatedAt).toBeDefined();
        expect(graph.formatterProvider).toBe("groq");
        expect(graph.pipelineLatencyMs).toBe(1250);
    });

    it("captures patient symptom inputs accurately", () => {
        const graph = buildEvidenceGraph(mockInput);

        expect(graph.symptomInputs.locations).toEqual(["head", "temples"]);
        expect(graph.symptomInputs.painType).toBe("throbbing");
        expect(graph.symptomInputs.triggers).toBe("bright light");
        expect(graph.symptomInputs.duration).toBe("2 days");
        expect(graph.symptomInputs.sanitizedSymptomText).toContain("Nausea and light sensitivity");
    });

    it("preserves Bayesian MCMC evidence and convergence statistics", () => {
        const graph = buildEvidenceGraph(mockInput);

        expect(graph.bayesianEvidence.conditionName).toBe("Migraine");
        expect(graph.bayesianEvidence.posteriorScore).toBe(88);
        expect(graph.bayesianEvidence.supportingSymptoms).toContain("throbbing");
        expect(graph.bayesianEvidence.mcmcDiagnostics?.rHat).toBe(1.002);
        expect(graph.bayesianEvidence.mcmcDiagnostics?.converged).toBe(true);
        expect(graph.bayesianEvidence.mcmcDiagnostics?.effectiveSampleSize).toBe(850);
    });

    it("correctly identifies classical corpuses (Charaka, Astanga Hridaya, Boericke)", () => {
        const graph = buildEvidenceGraph(mockInput);

        const corpuses = graph.ragCitations.map((c) => c.corpus);
        expect(corpuses).toContain("boericke_materia_medica");
        expect(corpuses).toContain("charaka_samhita");
        expect(corpuses).toContain("astanga_hridaya");
        expect(corpuses).toContain("indian_medicinal_plants");
        expect(corpuses).toContain("traditional_home_remedies");
    });

    it("formats citation section names and retrieves similarity scores", () => {
        const graph = buildEvidenceGraph(mockInput);

        const belladonnaCitation = graph.ragCitations.find((c) => c.section.includes("Belladonna"));
        expect(belladonnaCitation).toBeDefined();
        expect(belladonnaCitation?.similarityScore).toBe(0.84);
        expect(belladonnaCitation?.embeddingProvider).toBe("jina");
        expect(belladonnaCitation?.retrievalFunction).toBe("match_boericke_embeddings");

        const charakaCitation = graph.ragCitations.find((c) => c.corpus === "charaka_samhita");
        expect(charakaCitation).toBeDefined();
        expect(charakaCitation?.sourceTitle).toBe("Charaka Samhita");
        expect(charakaCitation?.embeddingProvider).toBe("gemini");
    });

    it("links remedies back to supporting classical citations with fuzzy matching", () => {
        const graph = buildEvidenceGraph(mockInput);

        expect(graph.recommendationLinks.length).toBe(2);

        const belladonnaLink = graph.recommendationLinks.find((l) => l.recommendationName.includes("Belladonna"));
        expect(belladonnaLink).toBeDefined();
        expect(belladonnaLink?.recommendationType).toBe("homeopathic_remedy");
        expect(belladonnaLink?.supportingCitationIds.length).toBeGreaterThan(0);
        expect(belladonnaLink?.evidenceStrength).toBe("strong");
        expect(belladonnaLink?.evidenceSummary).toContain("Boericke Materia Medica");

        const gingerLink = graph.recommendationLinks.find((l) => l.recommendationName.includes("Ginger"));
        expect(gingerLink).toBeDefined();
        expect(gingerLink?.recommendationType).toBe("home_remedy");
        expect(gingerLink?.supportingCitationIds.length).toBeGreaterThan(0);
    });

    it("tracks RAG retrieval metadata accurately", () => {
        const graph = buildEvidenceGraph(mockInput);

        expect(graph.ragMetadata.totalQueries).toBe(3);
        expect(graph.ragMetadata.boerickeChunksRetrieved).toBe(2);
        expect(graph.ragMetadata.ayurvedicChunksRetrieved).toBe(2);
        expect(graph.ragMetadata.pdfChunksRetrieved).toBe(1);
        expect(graph.ragMetadata.homeRemedyChunksRetrieved).toBe(1);
        expect(graph.ragMetadata.cacheHit).toBe(false);
        expect(graph.ragMetadata.activeProviders).toEqual(["jina", "gemini"]);
    });

    it("handles empty RAG inputs gracefully without failing", () => {
        const emptyInput: BuilderInput = {
            symptoms: {
                locations: ["knee"],
                sanitizedSymptomText: "knee pain",
            },
            bayesian: {
                conditionName: "Osteoarthritis",
                bayesianScore: 70,
                matchedKeywords: ["knee"],
                clinicalRuleAlerts: [],
                posteriorRedFlags: [],
            },
            boerickeChunks: [],
            ayurvedicChunks: [],
            pdfChunks: [],
            homeRemedyChunks: [],
            aiRemedies: [{ name: "Rhus Tox" }],
            aiHomeRemedies: [],
            provider: "gemini",
            latencyMs: 900,
            cacheHit: true,
            activeProviders: [],
            totalQueries: 0,
        };

        const graph = buildEvidenceGraph(emptyInput);
        expect(graph.ragCitations.length).toBe(0);
        expect(graph.recommendationLinks.length).toBe(1);
        expect(graph.recommendationLinks[0].evidenceStrength).toBe("traditional");
        expect(graph.ragMetadata.cacheHit).toBe(true);
    });
});

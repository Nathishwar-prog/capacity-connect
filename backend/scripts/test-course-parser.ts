import { documentParserService } from '../src/services/document-parser.service';
import prisma from '../src/database/client';

async function runParserTest() {
    console.log('🧪 Starting Course Document Parser Unit & Integration Test...');

    // Synthetic syllabus document simulating a comprehensive Capacity Building Course document
    const mockDocumentText = `
ADVANCED METEOROLOGICAL FORECASTER TRAINING
Postgraduate Diploma & In-Service Specialization

TABLE OF CONTENTS
Course Overview .................................................... Page 1
Target Audience & Prerequisites .................................... Page 2
Module 1: Atmospheric Dynamics & Synoptic Systems ................. Page 3
  1.1 Circulation Theorems & Vorticity Dynamics .................... Page 4
  1.2 Frontogenesis and Baroclinic Instability ..................... Page 6
Module 2: Radar Meteorology & DWR Operations ...................... Page 8
  2.1 Doppler Velocity De-aliasing and Beam Propagation ............ Page 9
  2.2 Dual-Polarization Signatures & Hydrometeor Classification .... Page 12
Glossary ........................................................... Page 15
References ......................................................... Page 16

COURSE OVERVIEW
This advanced capacity-building curriculum prepares operational meteorologists for severe weather surveillance, numerical weather prediction interpretation, and Doppler weather radar data analysis. Designed under the World Meteorological Organization (WMO-258) standards for Aeronautical and Public Weather Forecasters.

TARGET AUDIENCE
Meteorologists, scientific officers, hydrologists, and technical personnel in national meteorological services seeking operational forecasting certification.

LEARNING OUTCOMES
• Analyze synoptic and mesoscale pressure systems using quasi-geostrophic theory.
• Interpret Doppler Weather Radar base data including reflectivity and radial velocity.
• Identify hydrometeor types from dual-polarization moments (ZDR, CC, KDP).
• Apply numerical weather prediction guidance to extreme weather event early warnings.

PREREQUISITES
Bachelor's degree in Physics, Meteorology, Mathematics, or Atmospheric Sciences with foundational knowledge in differential equations and thermodynamics.

MODULE 1: Atmospheric Dynamics & Synoptic Systems
This module covers governing equations of motion, balance approximations, and baroclinic growth.

1.1 Circulation Theorems & Vorticity Dynamics
OBJECTIVES
• Understand Kelvin and Bjerknes circulation theorems.
• Derive the absolute vorticity equation in isobaric coordinates.
• Identify potential vorticity conservation in upper tropospheric troughs.

The atmospheric circulation is governed by Navier-Stokes equations adapted for a rotating frame of reference. When thermal gradients coincide with pressure gradients, solenoidal circulation is generated according to Bjerknes theorem.

NOTE: Potential vorticity thinking allows forecasters to identify tropopause folds associated with cyclogenesis without resolving full numerical wind fields.

EXAMPLE: Case study of October 2024 Cyclone Dana in the Bay of Bengal showing mid-tropospheric positive vorticity advection preceding rapid intensification.

KEY TAKEAWAYS
• Circulation theorems explain the generation of vorticity by baroclinic solenoids.
• Relative vorticity advection by geostrophic winds diagnoses vertical motion via omega equation.

KNOWLEDGE CHECK
Question 1: According to Bjerknes circulation theorem, solenoidal circulation is produced when:
A) Isobaric and isopycnic surfaces are parallel
B) Density gradients intersect pressure gradients *(Correct)*
C) Geostrophic balance is strictly hydrostatic
D) The Rossby number exceeds 10
Answer: B
Explanation: Baroclinic generation of circulation requires the intersection of surfaces of constant pressure and constant density.

MODULE 2: Radar Meteorology & DWR Operations
This module covers microwave radar theory, Doppler effect, pulse repetition frequency, and dual-polarization moments.

2.1 Doppler Velocity De-aliasing and Beam Propagation
OBJECTIVES
• Calculate maximum unambiguous range and Doppler velocity (Doppler dilemma).
• Identify atmospheric refraction regimes including sub-refraction, super-refraction, and ducting.
• Recognize velocity folding patterns in severe squall lines.

Radars operating at S-band and C-band utilize microwave pulse reflection to detect hydrometeors. The Doppler frequency shift enables real-time extraction of radial velocity toward or away from the antenna.

WARNING: Super-refraction occurs in intense temperature inversions with sharp moisture decrease, causing anomalous ground clutter returns that may masquerade as heavy precipitation.

KEY TAKEAWAYS
• The Doppler dilemma requires trading off maximum unambiguous range against Nyquist velocity.
• Dual-PRF pulsing techniques resolve velocity ambiguities up to 48 m/s.

KNOWLEDGE CHECK
Question 2: What radar propagation phenomenon occurs when the vertical refractivity gradient dN/dh is less than -157 N-units/km?
A) Sub-refraction
B) Normal standard refraction
C) Atmospheric ducting *(Correct)*
D) Complete attenuation
Answer: C
Explanation: Ducting traps radar energy within a horizontal layer when dN/dh falls below -157 N/km.

GLOSSARY
Baroclinic: An atmosphere where density depends on both temperature and pressure.
Nyquist Velocity: The maximum radial velocity unambiguously measurable by a pulsed Doppler radar.
Refractivity: A measure of the deviation of the atmospheric refractive index from unity.

REFERENCES
• Rinehart, R. E. (2010). Radar for Meteorologists.
• Holton, J. R. (2004). An Introduction to Dynamic Meteorology.
`;

    // Convert text to Buffer
    const buffer = Buffer.from(mockDocumentText, 'utf-8');

    // Parse document
    const parsed = await documentParserService.parseDocument(
        buffer,
        'PDF',
        'doc-test-uuid-001',
        'Advanced_Meteorological_Forecaster_Training.pdf'
    );

    console.log('\n--- PARSER RESULTS ---');
    console.log(`Title: "${parsed.title}"`);
    console.log(`Category: "${parsed.category}"`);
    console.log(`Detected TOC Items: ${parsed.detectedTOC.length}`);
    console.log(`Overall Confidence: ${(parsed.overallConfidence * 100).toFixed(1)}%`);
    console.log(`Modules Count: ${parsed.modules.length}`);
    console.log(`Global Topics Count: ${parsed.globalTopics.length}`);
    console.log(`Topic Prerequisites: ${parsed.topicPrerequisites.length}`);
    console.log(`Special Sections:`, {
        hasOverview: Boolean(parsed.specialSections.overview),
        hasTargetAudience: Boolean(parsed.specialSections.targetAudience),
        learningOutcomesCount: parsed.specialSections.learningOutcomes?.length || 0,
        hasPrerequisites: Boolean(parsed.specialSections.prerequisitesText),
        glossaryCount: parsed.specialSections.glossary?.length || 0,
        referencesCount: parsed.specialSections.references?.length || 0,
    });

    // Assertions
    if (!parsed.title.includes('METEOROLOGICAL')) {
        throw new Error(`Assertion failed: Title not extracted correctly. Got: ${parsed.title}`);
    }

    if (parsed.detectedTOC.length < 5) {
        throw new Error(`Assertion failed: Expected at least 5 TOC items. Got: ${parsed.detectedTOC.length}`);
    }

    // Verify TOC was suppressed from becoming modules
    const tocAsModule = parsed.modules.some((m) => /table of contents/i.test(m.title));
    if (tocAsModule) {
        throw new Error('Assertion failed: Table of Contents was NOT suppressed and appeared as a module!');
    }

    // Verify Special sections were classified
    if (!parsed.specialSections.overview || !parsed.specialSections.targetAudience) {
        throw new Error('Assertion failed: Overview or Target Audience special section missing.');
    }

    if (!parsed.specialSections.learningOutcomes || parsed.specialSections.learningOutcomes.length < 3) {
        throw new Error('Assertion failed: Learning outcomes not extracted as bullet points.');
    }

    // Verify Modules count
    if (parsed.modules.length < 2) {
        throw new Error(`Assertion failed: Expected 2 modules. Got: ${parsed.modules.length}`);
    }

    // Verify Lessons inside Module 1
    const mod1 = parsed.modules[0];
    console.log(`\nModule 1: "${mod1.title}", Lessons: ${mod1.lessons.length}`);
    const les1 = mod1.lessons[0];
    console.log(`  Lesson 1.1: "${les1.title}"`);
    console.log(`    Objectives: ${les1.learningObjectives.length}`);
    console.log(`    Content Blocks: ${les1.contentBlocks.length} (types: ${les1.contentBlocks.map((b) => b.type).join(', ')})`);
    console.log(`    Knowledge Checks: ${les1.knowledgeChecks.length}`);

    if (les1.learningObjectives.length === 0) {
        throw new Error('Assertion failed: Learning objectives missing in lesson 1.1');
    }

    if (les1.knowledgeChecks.length === 0) {
        throw new Error('Assertion failed: Knowledge check question missing in lesson 1.1');
    }

    const q1 = les1.knowledgeChecks[0];
    if (q1.options.length !== 4) {
        throw new Error(`Assertion failed: Expected 4 options for Q1. Got: ${q1.options.length}`);
    }
    const correctOpt = q1.options.find((o) => o.isCorrect);
    if (!correctOpt || !correctOpt.optionText.includes('Density gradients')) {
        throw new Error(`Assertion failed: Correct option B was not designated. Correct: ${JSON.stringify(correctOpt)}`);
    }

    // Verify Competency Mapping
    console.log('\n--- TOPIC & COMPETENCY MAPPINGS ---');
    parsed.globalTopics.forEach((t) => {
        console.log(
            `  Topic: "${t.name}" -> Competency: "${t.matchedCompetencyName || 'UNMAPPED'}" (Confidence: ${(t.confidence * 100).toFixed(0)}%, Status: ${t.status})`
        );
    });

    const radarTopic = parsed.globalTopics.find((t) => t.code.includes('RADAR'));
    if (radarTopic && radarTopic.matchedCompetencyName) {
        console.log(`\n✅ High confidence competency match verified: ${radarTopic.name} -> ${radarTopic.matchedCompetencyName}`);
    }

    console.log('\n🎉 ALL DOCUMENT PARSER ASSERTIONS PASSED PERFECTLY!\n');
    await prisma.$disconnect();
}

runParserTest().catch((err) => {
    console.error('❌ Parser Test Failed:', err);
    prisma.$disconnect();
    process.exit(1);
});

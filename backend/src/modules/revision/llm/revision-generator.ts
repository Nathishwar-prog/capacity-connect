import { PromptContext, buildRevisionPrompt } from './revision-prompt';
import { revisionEducationalContentSchema } from './revision.schema';
import { RevisionEducationalContent } from '../types/revision.types';
import logger from '../../../logger/winston.logger';

export class RevisionContentGenerator {
  /**
   * Generates validated revision educational content for a topic.
   * If the LLM provider fails or is unconfigured, returns domain-accurate MoES/IMD fallback content.
   */
  async generateContent(context: PromptContext): Promise<RevisionEducationalContent> {
    const { systemPrompt, userPrompt } = buildRevisionPrompt(context);

    // If API key is present, attempt LLM call
    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const rawContent = await this.callLLMProvider(systemPrompt, userPrompt);
        if (rawContent) {
          const parsedJson = JSON.parse(rawContent);
          const validated = revisionEducationalContentSchema.parse(parsedJson);
          return validated;
        }
      } catch (err: any) {
        logger.warn(
          `LLM content generation failed for topic ${context.topicCode}. Engaging deterministic MoES fallback. Error: ${err.message}`
        );
      }
    }

    // High-fidelity deterministic fallback tailored to MoES/IMD meteorological topics
    return this.getMoESFallbackContent(context);
  }

  /**
   * Calls LLM provider via fetch (generic OpenAI-compatible or HTTP endpoint)
   */
  private async callLLMProvider(systemPrompt: string, userPrompt: string): Promise<string | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM provider returned status ${response.status}`);
    }

    const data = (await response.json()) as any;
    return data.choices?.[0]?.message?.content ?? null;
  }

  /**
   * Deterministic high-quality MoES / IMD domain fallback generator
   */
  public getMoESFallbackContent(context: PromptContext): RevisionEducationalContent {
    const { topicCode, topicName, groupName, revisionMode } = context;

    let conceptIntro = `This targeted ${revisionMode.toLowerCase()} revision module focuses on ${topicName} (${topicCode}) within the ${groupName} operational competency domain. Understanding these atmospheric physics principles is essential for reliable observation, synoptic forecasting, and severe weather warning dissemination.`;
    let coreRuleRecap = `Fundamental Principle: The governing dynamic equilibrium requires balancing pressure gradient, Coriolis, and centrifugal forces while adhering to mass conservation and hydrostatic assumptions in standard IMD numerical and observational workflows.`;
    let commonTrap = `Analytical Misconception: Failing to account for local orographic boundary layer friction or interpreting single-polarization radar reflectivity without Doppler radial velocity verification, leading to false velocity signatures or inaccurate rainfall rate estimates.`;
    let exampleCase = `Operational Case Study: Bay of Bengal Severe Cyclonic Storm surveillance where rapid vertical wind shear diagnostic and INSAT-3DR TIR-1 brightness temperature gradients (< -70°C) informed track prediction.`;
    let practiceQuestion = {
      questionId: `pq_${topicCode.toLowerCase()}_1`,
      questionText: `In the context of ${topicName}, which operational diagnostic parameter provides the most reliable indicator of severe convection or cyclogenesis?`,
      options: [
        'Positive potential vorticity advection aloft coupled with low-level moist convergence',
        'Unstratified dry neutral lapse rate throughout the middle troposphere',
        'Uniform geostrophic balance with zero vertical wind shear',
        'Surface divergence accompanied by mid-level subsidence',
      ],
      correctOptionIndex: 0,
      explanation:
        'Positive potential vorticity (PV) advection in the upper troposphere induces strong ascent when coinciding with low-level convergence and high equivalent potential temperature (Theta-e), triggering deep moist convection.',
      hint: 'Recall the quasi-geostrophic omega equation and the role of upper-level differential vorticity advection.',
      difficultyLevel: context.difficultyLevel,
    };
    let retrievalCheck = {
      prompt: `State the primary quantitative threshold or governing physical equation defining stability criteria for ${topicName}.`,
      targetCriteria: [
        'Identification of buoyant versus shear energy',
        'Recognition of standard IMD operational warning criteria',
      ],
      expectedAnswerSummary:
        'The balance between convective available potential energy (CAPE > 1500 J/kg) and 0-6 km bulk shear (> 20 m/s) determines storm morphology and organized multicell/supercell longevity.',
    };
    let quickSummary = `Key Operational Takeaway: Mastering ${topicName} ensures rapid anomaly detection, accurate radar/satellite product interpretation, and minimizes lead-time errors in IMD early warnings.`;

    // Specialized tailoring for Radar, NWP, Satellite, or Synoptic domains
    if (topicCode.startsWith('RAD') || groupName.toLowerCase().includes('radar')) {
      conceptIntro = `Doppler Weather Radar (DWR) surveillance of ${topicName} provides real-time reflectivity (Z), radial velocity (V), and spectrum width (W) to track mesoscale convective systems and precipitation cores across IMD coastal and inland radar networks.`;
      coreRuleRecap = `Radar Equation & Doppler Dilemma: Maximum unambiguous range (R_max = c / 2*PRF) and maximum unambiguous velocity (V_max = lambda * PRF / 4) are inversely related: R_max * V_max = c * lambda / 8.`;
      commonTrap = `Doppler Velocity Aliasing / Nyquist Folding: Velocity folding occurs when radial velocity exceeds V_max, causing high inbound velocities to appear as false outbounds. Always verify with dual-PRF dealiasing.`;
      exampleCase = `Kolkata DWR Case Study: Tracking a pre-monsoon Nor'wester squall line with bow echo gust fronts, hook echo signatures, and mesocyclone rotation exceeding 20 m/s shear.`;
      practiceQuestion.questionText = `When analyzing a Doppler Weather Radar radial velocity display during severe weather, what signature indicates a cyclonic circulation in the northern hemisphere?`;
      practiceQuestion.options = [
        'A couplet with inbound velocities to the left and outbound velocities to the right of the radar beam looking down-radial',
        'Uniform outbound velocities in all quadrants of the radar display',
        'Reflectivity values strictly below 15 dBZ in the storm core',
        'A zero velocity isodop perpendicular to the ambient environmental shear vector',
      ];
      practiceQuestion.correctOptionIndex = 0;
      practiceQuestion.explanation = `In the Northern Hemisphere, a cyclonic vortex displays inbound velocities on the left side and outbound velocities on the right side of the radar azimuth radial.`;
    } else if (topicCode.startsWith('NWP') || groupName.toLowerCase().includes('numerical')) {
      conceptIntro = `Numerical Weather Prediction (NWP) modeling for ${topicName} relies on discretized primitive equations to predict atmospheric motion across IMD operational models (NCUM, WRF-ARW, GFS).`;
      coreRuleRecap = `CFL (Courant-Friedrichs-Lewy) Condition: Numerical stability demands c * delta_t / delta_x <= 1. Explicit time integration becomes unstable if the advective/gravity wave speed exceeds grid-cell transit per timestep.`;
      commonTrap = `Parameterization Drift: Expecting sub-grid convective parameterization schemes (Kain-Fritsch / Betts-Miller-Janjic) to behave realistically at convection-permitting resolutions (< 3 km), leading to double-counting convection.`;
      exampleCase = `MoES IMD Global Model (NCUM 12km) vs Regional WRF (3km) assimilation of INSAT-3D radiance data during the onset of the Southwest Monsoon over Kerala.`;
    } else if (topicCode.startsWith('SAT') || groupName.toLowerCase().includes('satellite')) {
      conceptIntro = `Satellite Meteorology for ${topicName} utilizes multispectral imagery from INSAT-3D/3DR (Visible, SWIR, MWIR, TIR-1, TIR-2, Water Vapor) to monitor cloud top morphology, deep convection, and upper-level wind vectors.`;
      coreRuleRecap = `Planck Radiation Law and Brightness Temperature: Spectral radiance measured in infrared channels corresponds to effective blackbody emission temperature of cloud tops or earth surface via Planck's inversion.`;
      commonTrap = `Parallax Error and Thin Cirrus Misclassification: High-altitude cirrus clouds over low-latitude tropical cyclones exhibit geometric displacement relative to ground coordinates, and semitransparent cirrus falsely indicates warm cloud tops in single-band thermal IR.`;
      exampleCase = `Rapid Scan Service of INSAT-3DR tracking convective cloud top cooling rates (-80°C) during severe thunderstorm development over Chota Nagpur plateau.`;
    }

    return {
      conceptIntro,
      coreRuleRecap,
      commonTrapAvoided: commonTrap,
      meteorologicalExamples: [exampleCase],
      practiceQuestions: [practiceQuestion],
      retrievalCheck,
      quickSummary,
    };
  }
}

export const revisionContentGenerator = new RevisionContentGenerator();

import { CoachProvider, CoachContext, CoachResponse, ChatMessage } from '../../domain/coach';
import { MockCoachProvider } from './mockCoachProvider';

// We can swap this with a real LLM provider later (e.g. OpenAiCoachProvider)
const provider: CoachProvider = new MockCoachProvider();

export const CoachService = {
  async generateResponse(context: CoachContext, message: string, history: ChatMessage[] = []): Promise<CoachResponse> {
    try {
      return await provider.generateResponse(context, message, history);
    } catch (error) {
      console.error('CoachService Error:', error);
      
      // Fallback if the provider fails
      if (context.activeRecommendations && context.activeRecommendations.length > 0) {
         const topRec = context.activeRecommendations[0];
         return { message: `${topRec.message} ${topRec.reason || ''}` };
      }
      
      return {
        message: "Le coach n'est pas disponible pour le moment. Mais continue à suivre ton plan d'entraînement !"
      };
    }
  },

  getSystemPrompt(): string {
    return `Tu es le coach conversationnel de Plana.
Tu aides l'athlète à comprendre son entraînement.
Tu ne remplaces jamais les moteurs métier.
Tu ne modifies jamais directement le planning.
Tu ne dois jamais inventer de données.
Tu dois utiliser uniquement les informations présentes dans le contexte fourni.
Si une information manque : dis-le clairement.

Tu dois être :
- simple ;
- humain ;
- motivant ;
- précis ;
- concis ;
- non culpabilisant.

Tu dois éviter le jargon inutile.
Si tu utilises : CTL, ATL, TSB, TSS, tu dois immédiatement l'expliquer simplement.

Règle absolue : Ne fais jamais de diagnostic médical.`;
  }
};

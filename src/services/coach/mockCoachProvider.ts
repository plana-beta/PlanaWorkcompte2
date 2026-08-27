import { CoachProvider, CoachContext, CoachResponse, ChatMessage, CoachIntent } from '../../domain/coach';

export class MockCoachProvider implements CoachProvider {
  async generateResponse(context: CoachContext, message: string, history: ChatMessage[]): Promise<CoachResponse> {
    const lowerMessage = message.toLowerCase();

    // 1. Substitution / Modification
    if (lowerMessage.includes('remplace') || lowerMessage.includes('changer') || lowerMessage.includes('autre séance')) {
      return {
        message: 'Oui, c\'est possible. Je te propose de remplacer la séance actuelle par une alternative adaptée pour conserver une charge similaire.\n\nTu veux que j\'applique ce changement ?',
        intent: {
          type: 'REQUEST_WORKOUT_SUBSTITUTION',
          userMessage: message,
          workoutId: context.todayWorkout?.id
        }
      };
    }

    // 2. Pourquoi cette séance ? / Explication
    if (lowerMessage.includes('pourquoi') && (lowerMessage.includes('séance') || lowerMessage.includes('aujourd\'hui'))) {
      if (context.todayWorkout) {
        let responseMessage = context.todayWorkout.explanation || 'Cette séance permet de continuer ta progression.';
        if (context.todayWorkout.isAdapted && context.todayWorkout.adaptedReason) {
          responseMessage += ' ' + context.todayWorkout.adaptedReason;
        }
        return { message: responseMessage };
      }
      return { message: 'Il n\'y a pas de séance prévue aujourd\'hui. Profites-en pour bien récupérer.' };
    }

    // 3. Pourquoi le plan a changé ? / Explication adaptation
    if (lowerMessage.includes('changé') || lowerMessage.includes('adapté')) {
      const adaptedWorkout = context.todayWorkout?.isAdapted ? context.todayWorkout : context.upcomingWorkouts.find(w => w.isAdapted);
      if (adaptedWorkout && adaptedWorkout.adaptedReason) {
        return { message: `J'ai adapté ton plan : ${adaptedWorkout.adaptedReason}` };
      }
      return { message: 'Ton plan n\'a pas subi de modification récente majeure.' };
    }

    // 4. Comment va ma forme ? / Fatigue
    if (lowerMessage.includes('forme') || lowerMessage.includes('fatigué') || lowerMessage.includes('fatigue')) {
      if (context.recentFatigue) {
        if (context.recentFatigue.tsb < -15) {
          return { message: 'Ta fatigue récente est assez élevée. Aujourd\'hui, l\'objectif est donc de bien récupérer plutôt que d\'ajouter de la charge.' };
        } else if (context.recentFatigue.tsb > 10) {
          return { message: 'Tu es dans une phase de grande fraîcheur ! C\'est idéal pour une séance clé ou une compétition.' };
        }
        return { message: 'Ta charge d\'entraînement et ta récupération sont bien équilibrées actuellement. Continue comme ça.' };
      }
      return { message: 'Je n\'ai pas assez de données pour évaluer ta forme. Pense à synchroniser tes entraînements.' };
    }
    
    // 5. Que dois-je faire aujourd'hui ?
    if (lowerMessage.includes('que dois') || lowerMessage.includes('quoi aujourd\'hui')) {
      if (context.todayWorkout) {
        return { message: `Aujourd'hui, tu as ${context.todayWorkout.targetDurationMin} min de ${context.todayWorkout.sport}. ${context.todayWorkout.explanation || ''}` };
      }
      return { message: 'Aujourd\'hui est un jour de repos. Profite de cette journée pour assimiler ta charge d\'entraînement.' };
    }
    
    // 6. En retard / Objectif
    if (lowerMessage.includes('retard') || lowerMessage.includes('temps') || lowerMessage.includes('objectif')) {
      return { message: 'Tu es sur une bonne dynamique. Continue de suivre ton plan réguliérement, c\'est la clé pour construire tes fondations physiologiques vers ton objectif.' };
    }
    
    // Fallback based on recommendations
    if (context.activeRecommendations && context.activeRecommendations.length > 0) {
      const topRec = context.activeRecommendations[0];
      return { message: `${topRec.message} ${topRec.reason || ''}` };
    }

    // Default Fallback
    return {
      message: 'Je suis ton coach Plana. Je peux t\'expliquer tes séances, analyser ta forme ou adapter ton plan si besoin.'
    };
  }
}

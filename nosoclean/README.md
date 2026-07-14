# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c63d68e4-163f-4d37-b04d-10d39dea4eba

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `ANTHROPIC_API_KEY` in `.env` (or `.env.local`) with your Claude API key
3. (Optional) Set `ANTHROPIC_FILE_IDS` as a comma-separated list of file IDs from Anthropic file storage
4. (Optional) Set `NOSOCLEAN_SYSTEM_PROMPT` to override the default assistant system prompt
5. Run the app:
   `npm run dev`

## Fonctionnalités implémentées

### ✅ Reconnaissance vocale (Microphone)
- Support de la reconnaissance vocale en français
- Vérification des permissions microphone
- Gestion d'erreurs détaillée (pas de support navigateur, permissions refusées, etc.)
- Intégration directe avec le chatbot

### ✅ Chatbot IA
- Connecté à l'API Anthropic (Claude 3.5 Sonnet)
- Contexte spécialisé en hygiène professionnelle
- Réponses en français
- Streaming en temps réel

### ✅ Images adaptées au contenu
- Images organisées par catégorie dans `/public/images/`
- Noms de fichiers descriptifs pour chaque secteur
- Voir `/public/images/README.md` pour les images requises

## Images à ajouter

Placez les images suivantes dans `/public/images/` :
- `hospital-sterilization.jpg`
- `pharma-cleanroom.jpg`
- `food-industry-hygiene.jpg`
- `restaurant-kitchen.jpg`
- `dental-sterilization.jpg`
- `default-article.jpg`

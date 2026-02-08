
/**
 * Utility to safely get environment variables in a browser context.
 */
const getSafeEnv = (key: string): string => {
  try {
    if (typeof window !== 'undefined' && (window as any).process?.env?.[key]) {
      return (window as any).process.env[key];
    }
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {}
  return '';
};

export const emailService = {
  sendAuditReport: async (reportData: any) => {
    const serviceId = getSafeEnv('EMAILJS_SERVICE_ID');
    const templateId = getSafeEnv('EMAILJS_TEMPLATE_ID');
    const publicKey = getSafeEnv('EMAILJS_PUBLIC_KEY');

    if (!serviceId || !templateId || !publicKey) {
      console.warn("EmailJS : Variables de configuration manquantes sur Vercel.");
      return false;
    }

    try {
      // @ts-ignore - EmailJS est chargé via CDN dans index.html
      if (typeof window !== 'undefined' && (window as any).emailjs) {
        
        // On s'assure que les données sont des strings simples pour éviter DOMException
        const payload = {
          doctor_name: "Dr Happy",
          hospital: "Hôpital Laquintinie",
          priority_feature: String(reportData.priorityFeature || "Audit IA"),
          time_gain: String(reportData.timeGain || "Non spécifié"),
          report_json: JSON.stringify(reportData)
        };

        await (window as any).emailjs.send(serviceId, templateId, payload, publicKey);
        console.log("Audit envoyé avec succès au promoteur.");
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur EmailJS:', error);
      return false;
    }
  }
};

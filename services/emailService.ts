
const getEnv = (key: string): string => {
  if (typeof window !== 'undefined' && (window as any).process?.env?.[key]) {
    return (window as any).process.env[key];
  }
  return typeof process !== 'undefined' ? (process.env?.[key] || '') : '';
};

export const emailService = {
  sendAuditReport: async (reportData: any) => {
    const serviceId = getEnv('EMAILJS_SERVICE_ID');
    const templateId = getEnv('EMAILJS_TEMPLATE_ID');
    const publicKey = getEnv('EMAILJS_PUBLIC_KEY');

    if (!serviceId || !templateId || !publicKey) {
      console.warn("EmailJS : Variables manquantes.");
      return false;
    }

    try {
      if (typeof window !== 'undefined' && (window as any).emailjs) {
        await (window as any).emailjs.send(
          serviceId, templateId,
          {
            doctor_name: "Dr Happy",
            hospital: "Hôpital Laquintinie",
            priority_feature: reportData.priorityFeature,
            time_gain: reportData.timeGain
          },
          publicKey
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur EmailJS:', error);
      return false;
    }
  }
};


/**
 * Utility to safely get environment variables in a browser context.
 */
const getSafeEnv = (key: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
    if (typeof window !== 'undefined' && (window as any).process?.env?.[key]) {
      return (window as any).process.env[key];
    }
  } catch (e) {
    console.warn(`Error accessing env var ${key}:`, e);
  }
  return '';
};

export const emailService = {
  sendAuditReport: async (reportData: any) => {
    const serviceId = getSafeEnv('EMAILJS_SERVICE_ID');
    const templateId = getSafeEnv('EMAILJS_TEMPLATE_ID');
    const publicKey = getSafeEnv('EMAILJS_PUBLIC_KEY');

    if (!serviceId || !templateId || !publicKey) {
      console.error("EmailJS credentials missing from Environment Variables.");
      return false;
    }

    try {
      // @ts-ignore - EmailJS is loaded from CDN in index.html
      if (typeof window !== 'undefined' && (window as any).emailjs) {
        const response = await (window as any).emailjs.send(
          serviceId,
          templateId,
          {
            to_name: "Promoteur DOULIA",
            doctor_name: "Dr Happy",
            hospital: "Hôpital Laquintinie",
            report_summary: JSON.stringify(reportData, null, 2),
            priority_feature: reportData.priorityFeature,
            time_gain: reportData.timeGain,
            impact: reportData.serviceImpact,
            pain_points: reportData.painPoints.join(', ')
          },
          publicKey
        );
        console.log('Email successfully sent!', response.status, response.text);
        return true;
      } else {
        console.error("EmailJS SDK not found on window object.");
        return false;
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }
};

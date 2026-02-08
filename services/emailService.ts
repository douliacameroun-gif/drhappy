
// EmailJS Service for Doulia
const getEnv = (key: string) => {
  try {
    return (typeof process !== 'undefined' && process.env) ? (process.env[key] || '') : '';
  } catch (e) {
    return '';
  }
};

export const emailService = {
  sendAuditReport: async (reportData: any) => {
    const serviceId = getEnv('EMAILJS_SERVICE_ID');
    const templateId = getEnv('EMAILJS_TEMPLATE_ID');
    const publicKey = getEnv('EMAILJS_PUBLIC_KEY');

    if (!serviceId || !templateId || !publicKey) {
      console.warn("EmailJS credentials missing. Report not sent by email.");
      return false;
    }

    try {
      // @ts-ignore - EmailJS is loaded from CDN in index.html
      const response = await window.emailjs.send(
        serviceId,
        templateId,
        {
          to_name: "Promoteur DOULIA",
          doctor_name: "Dr Happy",
          hospital: "Hôpital Laquintinie",
          report_summary: JSON.stringify(reportData, null, 2),
          priority_feature: reportData.priorityFeature,
          time_gain: reportData.timeGain,
          impact: reportData.serviceImpact
        },
        publicKey
      );
      console.log('Email sent successfully!', response.status, response.text);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }
};

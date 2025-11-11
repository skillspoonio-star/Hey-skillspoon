export const validatePhoneNumber = (phone: string): boolean => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    // Check if it's exactly 10 digits
    return cleanPhone.length === 10 && /^\d{10}$/.test(cleanPhone);
};

export const formatPhoneNumber = (phone: string): string => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    // Return only the first 10 digits if longer, or the cleaned input if shorter
    return cleanPhone.slice(0, 10);
};
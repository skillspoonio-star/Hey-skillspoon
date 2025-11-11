export const loadRazorpayScript = async (): Promise<void> => {
    if (document.getElementById('razorpay-script')) {
        return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';

    return new Promise((resolve) => {
        script.onload = () => resolve();
        document.body.appendChild(script);
    });
};
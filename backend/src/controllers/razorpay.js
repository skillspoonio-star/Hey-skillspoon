const { razorpayInstance, validatePaymentVerification } = require('../config/razorpay');
const MenuItem = require('../models/menuItem');

// Calculate the final amount including all charges
const calculateOrderAmount = async (items, tip = 0, promoCode = '') => {
    // Fetch menu items to get current prices
    const itemIds = items.map(item => Number(item.itemId));
    const menuItems = await MenuItem.find({ id: { $in: itemIds } });

    // Calculate subtotal
    let subtotal = 0;
    for (const orderItem of items) {
        const menuItem = menuItems.find(m => m.id === Number(orderItem.itemId));
        if (!menuItem) {
            throw new Error(`Menu item not found: ${orderItem.itemId}`);
        }
        subtotal += menuItem.price * orderItem.quantity;
    }

    // Calculate other charges
    let discount = 0;
    if (promoCode) {
        // Apply promo code discounts
        if (promoCode.toUpperCase() === 'FLAT50') {
            discount = 50;
        } else if (promoCode.toUpperCase() === 'SAVE10') {
            discount = Math.min(100, Math.round(subtotal * 0.1));
        }
    }

    const deliveryFee = subtotal > 999 ? 0 : 49;
    const tax = Math.round(subtotal * 0.18);
    const total = Math.max(0, subtotal - discount) + tax + deliveryFee + (tip || 0);

    return {
        subtotal,
        discount,
        tax,
        deliveryFee,
        tip: tip || 0,
        total,
        totalInPaise: total * 100 // Razorpay expects amount in paise
    };
};

// Create a new Razorpay order
exports.createOrder = async (req, res) => {
    try {
        const { items, tip, promo } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid items data'
            });
        }

        // Validate item structure
        for (const item of items) {
            if (!item.itemId || !Number.isFinite(Number(item.itemId)) || !Number.isFinite(item.quantity)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid item data: Each item must have a valid itemId and quantity`,
                    item
                });
            }
        }

        // Calculate final amount
        const amounts = await calculateOrderAmount(items, tip, promo);

        // Create Razorpay order
        const options = {
            amount: amounts.totalInPaise,
            currency: 'INR',
            receipt: 'order_' + Date.now(),
            notes: {
                orderType: 'food_delivery',
                items: JSON.stringify(items.map(i => ({ id: i.itemId, qty: i.quantity }))),
                tip: tip || 0,
                promo: promo || ''
            }
        };

        const order = await razorpayInstance.orders.create(options);

        res.json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt
            },
            amounts
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};

// Verify Razorpay payment
exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const isValid = validatePaymentVerification({
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            signature: razorpay_signature
        });

        if (isValid) {
            // Get payment details from Razorpay
            const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);
            
            // Map Razorpay payment method to our system's payment method
            let paymentMethod = 'upi'; // default
            if (payment.method) {
                switch(payment.method.toLowerCase()) {
                    case 'card':
                        paymentMethod = 'card';
                        break;
                    case 'netbanking':
                        paymentMethod = 'netbanking';
                        break;
                    case 'upi':
                    case 'wallet':
                        paymentMethod = 'upi';
                        break;
                    default:
                        paymentMethod = 'upi';
                }
            }

            res.json({
                success: true,
                message: 'Payment verified successfully',
                payment: {
                    id: payment.id,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                    method: paymentMethod,
                    orderId: payment.order_id,
                    captured: payment.captured
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
        });
    }
};